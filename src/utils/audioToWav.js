// File: src/utils/audioToWav.js

/**
 * يحوّل Blob صوتي (webm / ogg / mp4 ... إلخ) القادم من MediaRecorder
 * إلى ملف WAV حقيقي (PCM 16-bit, قناة واحدة Mono) باستخدام Web Audio API
 * مباشرة، بدون أي مكتبات خارجية.
 *
 * الهدف: ضمان توافق 100% مع خدمة Hugging Face للتعرف على الصوت
 * ومع الـ .NET backend الذي يستقبل الملف كـ multipart/form-data.
 *
 * @param {Blob} audioBlob - الصوت الأصلي القادم من MediaRecorder
 * @param {number} targetSampleRate - معدل العينة المطلوب (افتراضي 16000Hz، وهو الأنسب لمعظم نماذج التعرف على الصوت)
 * @returns {Promise<Blob>} - Blob بصيغة audio/wav جاهز للإرسال
 */
export async function convertBlobToWav(audioBlob, targetSampleRate = 16000) {
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error('الملف الصوتي فارغ، لا يمكن تحويله.')
  }

  const arrayBuffer = await audioBlob.arrayBuffer()

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    throw new Error('هذا المتصفح لا يدعم Web Audio API.')
  }

  const decodingContext = new AudioContextClass()

  let decodedBuffer
  try {
    // بعض المتصفحات (Safari القديم) تدعم فقط الـ callback API القديم
    decodedBuffer = await decodeAudioDataCompat(decodingContext, arrayBuffer)
  } finally {
    if (decodingContext.state !== 'closed' && typeof decodingContext.close === 'function') {
      decodingContext.close().catch(() => {})
    }
  }

  const monoResampledBuffer = await resampleToMono(decodedBuffer, targetSampleRate)
  const wavArrayBuffer = encodeWav(monoResampledBuffer)

  return new Blob([wavArrayBuffer], { type: 'audio/wav' })
}

/**
 * دالة توافقية لفك تشفير الصوت تدعم كل من الـ Promise API الحديث
 * والـ callback API القديم (Safari <= 13).
 */
function decodeAudioDataCompat(audioContext, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const maybePromise = audioContext.decodeAudioData(
      arrayBuffer,
      (buffer) => resolve(buffer),
      (err) => reject(err || new Error('فشل فك تشفير الملف الصوتي.'))
    )

    // في المتصفحات الحديثة decodeAudioData يرجع Promise أيضاً
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(resolve).catch(reject)
    }
  })
}

/**
 * دمج جميع قنوات الصوت إلى قناة واحدة (Mono) ثم إعادة أخذ العينات
 * (Resample) إلى معدل العينة المطلوب باستخدام OfflineAudioContext.
 */
async function resampleToMono(audioBuffer, targetSampleRate) {
  const monoBuffer =
    audioBuffer.numberOfChannels > 1 ? mixDownToMono(audioBuffer) : audioBuffer

  if (monoBuffer.sampleRate === targetSampleRate) {
    return monoBuffer
  }

  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext
  if (!OfflineAudioContextClass) {
    // لا يوجد دعم لإعادة أخذ العينات، نرجّع الـ buffer كما هو
    return monoBuffer
  }

  const targetLength = Math.max(1, Math.ceil(monoBuffer.duration * targetSampleRate))
  const offlineContext = new OfflineAudioContextClass(1, targetLength, targetSampleRate)

  const source = offlineContext.createBufferSource()
  source.buffer = monoBuffer
  source.connect(offlineContext.destination)
  source.start(0)

  return offlineContext.startRendering()
}

/**
 * دمج قنوات AudioBuffer (Stereo أو أكثر) إلى قناة واحدة عبر حساب المتوسط.
 */
function mixDownToMono(audioBuffer) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  const tempContext = new AudioContextClass()

  const numChannels = audioBuffer.numberOfChannels
  const length = audioBuffer.length
  const monoBuffer = tempContext.createBuffer(1, length, audioBuffer.sampleRate)
  const monoData = monoBuffer.getChannelData(0)

  for (let i = 0; i < length; i++) {
    let sum = 0
    for (let ch = 0; ch < numChannels; ch++) {
      sum += audioBuffer.getChannelData(ch)[i]
    }
    monoData[i] = sum / numChannels
  }

  if (typeof tempContext.close === 'function') {
    tempContext.close().catch(() => {})
  }

  return monoBuffer
}

/**
 * تحويل AudioBuffer (قناة واحدة) إلى ArrayBuffer بصيغة WAV صحيحة
 * (PCM 16-bit Little Endian) متوافقة مع أي سيرفر أو مكتبة تعرف على الصوت.
 */
function encodeWav(audioBuffer) {
  const numChannels = 1
  const sampleRate = audioBuffer.sampleRate
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample

  const samples = audioBuffer.getChannelData(0)
  const dataLength = samples.length * bytesPerSample

  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')

  // fmt sub-chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // حجم chunk الخاص بـ PCM
  view.setUint16(20, 1, true) // PCM format = 1
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true) // byte rate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)

  // data sub-chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
    offset += 2
  }

  return buffer
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}