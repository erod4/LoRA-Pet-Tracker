export const getTime = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return null
  }

  var ellapsedSec = (endTime - startTime) / 1000
  ellapsedSec = Math.floor(ellapsedSec)
  console.log('Ellapsed Time: ', ellapsedSec)

  if (ellapsedSec < 60) {
    const timeInSec =
      ellapsedSec <= 3.0 ? 'just now' : `${Math.floor(ellapsedSec)}s ago`
    return timeInSec
  } else if (ellapsedSec > 60.0 && ellapsedSec < 60.0 * 60.0) {
    return `${Math.floor(ellapsedSec / 60.0)}m ago`
  } else {
    return `${Math.floor(ellapsedSec / (60.0 * 60.0))}h ago`
  }
}
