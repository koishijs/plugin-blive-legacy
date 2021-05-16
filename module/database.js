const { getLiveDetailsByUid } = require('./getLive')
const { logger } = require('./util/logger')

const dbTable = 'bilibili-plus'

/**
 * @param {Session} session
 */
async function getFollowedBiliUps(session) {
  const data = await session.database.get(dbTable, {
    channels: [`${session.platform}:${session.channelId}`],
  })

  return data
}

/**
 * @param {Session} session
 */
async function addFollowedBiliUps(session, uid) {
  const channel = `${session.platform}:${session.channelId}`
  let userData = await session.database.get(dbTable, {
    b_uid: [uid],
  })

  logger.info(userData)

  let user = userData[0] || {}

  const channels = user?.channels || []
  if (user?.channels?.includes(channel))
    return `您已经单推过 ${user.b_username} 了，居然不记得了吗，臭弟弟。`

  channels.push(channel)

  const details = await getLiveDetailsByUid(uid)
  if (!details) return '未查询到直播间信息呢。'
  const { roomid, username, liveTime } = details

  const updateData = {
    b_uid: uid,
    b_username: username,
    b_roomid: roomid,
    lastCall: liveTime,
    channels,
  }

  if (userData.length < 1) {
    await session.database.create(dbTable, updateData)
  } else {
    await session.database.update(dbTable, [{ ...updateData, id: user.id }])
  }

  return `单推成功：${username} (直播间 ${roomid})`
}

/**
 * @param {Session} session
 */
async function removeFollowedBiliUps(session, uid) {
  const channel = `${session.platform}:${session.channelId}`
  let userData = await session.database.get(dbTable, {
    b_uid: [uid],
  })

  logger.info(userData)
  if (userData.length < 1) return '找不到主播数据。'

  const user = userData[0]

  const channels = user?.channels || []
  if (channels.includes(channel)) {
    channels.splice(channel.indexOf(channels), 1)
  } else {
    return `你根本就没关注过 ${user.b_username}，臭弟弟！`
  }

  if (channels.length < 1) {
    await session.database.remove(dbTable, { b_uid: [user.b_uid] })
    logger.info('无频道关注，移除记录', uid)
  } else {
    await session.database.update(dbTable, [{ channels, id: user.id }])
  }

  return `取关成功：${user.b_username} (直播间 ${user.b_roomid})，再见吧臭弟弟，你肯定喜欢上别的主播了。`
}

function getAllBiliUps(ctx) {
  return ctx.database.get(dbTable, {})
}

module.exports = {
  dbTable,
  getFollowedBiliUps,
  addFollowedBiliUps,
  removeFollowedBiliUps,
  getAllBiliUps,
}
