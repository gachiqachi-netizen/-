function pendingAiPhoto(path, recognition) {
  const success = recognition && recognition.ok === true
  return {
    path: typeof path === 'string' ? path : '',
    seen: success && typeof recognition.seen === 'string' ? recognition.seen : '',
    main: success && typeof recognition.main === 'string' ? recognition.main : ''
  }
}
module.exports = pendingAiPhoto
