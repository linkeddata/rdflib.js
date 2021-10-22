var TTH_OFFLINE_STATUS = false

function isOffline () {
  return TTH_OFFLINE_STATUS
}

function goOffline () {
  TTH_OFFLINE_STATUS = true
}

function goOnline () {
  TTH_OFFLINE_STATUS = false
}
