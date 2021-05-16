const { getLiveInit } = require('./getLive')
const { getUsersByName } = require('./getUser')

async function getUidByLiveid(roomid) {
  return (await getLiveInit(roomid)).uid
}

async function getUidByName(name) {
  const users = await getUsersByName(name)
  if (users.lenth < 1) return null
  return users[0].mid
}

function getUidFromSpaceUrl(url) {
  const reg = /(?:https?:)?\/\/space\.bilibili\.com\/([0-9]*).*/i
  const res = reg.exec(url)
  if (res && res[1]) return res[1]
  return null
}

module.exports = {
  getUidByLiveid,
  getUidByName,
  getUidFromSpaceUrl,
}
