// eslint-disable-next-line no-unused-vars
const { Context, Time } = require('koishi-core')
const { dbTable } = require('./database')
const { getLiveDetailsByUid } = require('./getLive')
const { logger } = require('../util/logger')
const { liveStatusName } = require('../util/liveStatusName')

/**
 * @param {Context} ctx
 */
async function checkBroadcast(ctx, user) {
  const { b_uid, lastCall } = user
  const { liveTime } = await getLiveDetailsByUid(b_uid)
  if (liveTime !== lastCall) {
    makeBroadcast(ctx, user)
  } else {
    logger.info(new Date().toISOString(), '未开播/已广播', b_uid)
  }
}

/**
 * @param {Context} ctx
 */
async function makeBroadcast(ctx, user) {
  const { id, b_uid, channels } = user
  const {
    title,
    roomid,
    url,
    roomNews,
    medalName,
    username,
    followerNum,
    liveStatus,
    liveTime,
    online,
  } = await getLiveDetailsByUid(b_uid)
  await ctx.broadcast(
    channels,
    [
      `您单推的主播${
        liveStatus === 1 ? '开播啦！' : '已下播，记得下次再来哦！'
      }`,
      title,
      url,
      roomNews.content ? roomNews.content : null,
      `主播：${
        medalName ? '[' + medalName + ']' : ''
      }${username} (${followerNum} 关注)`,
      `状态：${liveStatusName(liveStatus)} (${online} 人气)`,
      liveTime > 0
        ? `开播时间：${new Date(liveTime).toLocaleString()} ` +
          `(${Time.formatTime(Date.now() - liveTime)})`
        : null,
    ].join('\n')
  )
  await ctx.database.update(dbTable, [
    { id, lastCall: liveTime, b_username: username, b_roomid: roomid },
  ])
  logger.info(
    new Date().toISOString(),
    liveStatus === 1 ? '开播广播' : '下播广播',
    b_uid
  )
}

module.exports = {
  checkBroadcast,
  makeBroadcast,
}
