/**
 * @name koishi-plugin-blive
 * @desc Bilibili Live Subscription plugin for koishijs
 *
 * @license Apache-2.0
 * @author 机智的小鱼君 <dragon-fish@qq.com>
 */
// eslint-disable-next-line no-unused-vars
const { Context, segment, Time } = require('koishi-core')
const { Tables } = require('koishi-core')
const { logger } = require('./util/logger')

const { checkBroadcast } = require('./module/broadcast')
const {
  getFollowedBiliUps,
  addFollowedBiliUps,
  removeFollowedBiliUps,
  getAllBiliUps,
} = require('./module/database')
const { getLiveDetailsByUid } = require('./module/getLive')
const { getUidByLiveid, getUidByName } = require('./module/getUid')
const { getUserById, getUsersByName } = require('./module/getUser')
const { liveStatusName } = require('./util/liveStatusName')

/**
 * @param {Context} ctx
 */
function apply(ctx) {
  ctx = ctx.select('database').select('channel')

  ctx
    .command('bilibili.searchuser <username:string>', '查找 bilibili 用户')
    .shortcut(/^(?:查|找|查找)b站用户(.+)$/, { args: ['$1'] })
    .action(async ({ session }, username) => {
      if (!username) return
      const users = await getUsersByName(username)

      let uid
      if (users.length < 1) {
        return `没有找到名为 ${username} 的 bilibili 用户。`
      } else if (users.length > 1) {
        session.send(
          [
            '查询到了多个结果：',
            users
              .map((item, index) =>
                index < 10
                  ? `${index + 1}. ${item.uname} UID: ${item.mid}`
                  : null
              )
              .join('\n')
              .trim(),
            '请输入想查看的用户对应的编号。',
          ].join('\n')
        )
        let answer = await session.prompt(30 * 1000)
        answer = parseInt(answer)
        if (!answer || isNaN(answer) || answer > users.length || answer < 1) {
          return ''
        }
        uid = users[answer - 1].mid
      } else {
        uid = users[0].mid
      }

      const {
        mid,
        name,
        sex,
        face,
        sign,
        level,
        live_room,
      } = await getUserById(uid)

      return (
        segment('quote', { id: session.messageId }) +
        [
          segment('image', { url: face }),
          `${name} https://space.bilibili.com/${mid}`,
          `等级：${level}级，性别：${sex}`,
          sign,
          live_room.roomStatus === 1
            ? `直播间：[${liveStatusName(live_room.liveStatus)}] ` +
              `${live_room.title} ${live_room.url} ` +
              `(人气 ${live_room.online})`
            : null,
        ].join('\n')
      )
    })

  ctx
    .command('bilibili.live', '直播间查询')
    .shortcut(/^b站直播间([0-9]+)$/i, { options: { room: '$1' } })
    .shortcut(/^查b站(.+)的直播间$/i, { options: { username: '$1' } })
    .option('room', '-r <id:posint> 通过直播间号查询')
    .option('uid', '-u <uid:posint> 通过主播 UID 查询')
    .option('username', '-U <name:string> 通过主播用户名查询')
    .action(async ({ session, options }) => {
      let uid
      if (options.room) {
        uid = await getUidByLiveid(options.room)
      } else if (options.uid) {
        uid = options.uid
      } else if (options.username) {
        const data = await getUidByName(options.username)
        if (!data) return `没有找到名为 ${options.username} 的 bilibili 用户。`
        uid = data
      } else {
        return session.execute('bilibili.live -h')
      }

      const details = await getLiveDetailsByUid(uid)
      logger.info(details)
      if (!details) return '未查询到直播间信息呢。'
      const {
        title,
        cover,
        url,
        roomNews,
        medalName,
        username,
        followerNum,
        liveStatus,
        liveTime,
        online,
      } = details

      return [
        segment('image', { url: cover }),
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
    })

  ctx
    .command('bilibili.follow', '单推主播')
    .option('room', '-r <id:posint> 通过直播间号单推', { authority: 2 })
    .option('uid', '-u <uid:posint> 通过主播 UID 单推', { authority: 2 })
    .option('username', '-U <name:string> 通过主播用户名单推', { authority: 2 })
    .option('list', '-l 查看本群单推的主播')
    .option('remove', '-d, -R <uid:posint> 通过 UID 取消单推', { authority: 2 })
    .shortcut(/^单推b站主播(.+)$/i, { options: { username: '$1' } })
    .shortcut(/^单推列表$/, { options: { list: true } })
    .action(async ({ session, options }) => {
      // 获取单推列表
      if (options.list) {
        const users = await getFollowedBiliUps(session)
        if (users.length < 1) return '本群没有单推任何 bilibili 主播！'

        const userList = users
          .map((item, index) => {
            const lastTime = item.lastCall
              ? `(最近直播于 ${Time.formatTime(Date.now() - item.lastCall)} 前)`
              : '(未跟踪到直播信息)'
            const roomUrl = `https://live.bilibili.com/${item.b_roomid}`
            return `${index + 1}. ${item.b_username} (${
              item.b_uid
            })\n${roomUrl} ${lastTime}`
          })
          .join('\n')

        return [
          `本群一共单推了 ${users.length} 名 bilibili 主播！`,
          userList,
        ].join('\n')
      }

      // 取消
      if (options.remove) {
        return removeFollowedBiliUps(session, options.remove)
      }

      let uid
      if (options.room) {
        uid = await getUidByLiveid(options.room)
      } else if (options.uid) {
        uid = options.uid
      } else if (options.username) {
        const data = await getUidByName(options.username)
        if (!data) return `没有找到名为 ${options.username} 的 bilibili 用户。`
        uid = data
      } else {
        return session.execute('bilibili.follow --list')
      }

      return addFollowedBiliUps(session, uid)
    })

  // 轮询
  async function loopTimmer() {
    const users = await getAllBiliUps(ctx)
    users.forEach((user) => {
      checkBroadcast(ctx, user)
    })
    logger.info(
      new Date().toISOString(),
      '轮询',
      users.map((i) => i.b_uid)
    )
  }

  ctx.on('connect', () => {
    if (globalThis.biliPlusTimmer) return
    globalThis.biliPlusTimmer = true

    loopTimmer()
    // eslint-disable-next-line no-undef
    setInterval(loopTimmer, 60 * 1000)
  })

  // 扩展数据库
  Tables.extend(require('./module/database').dbTable, { primary: 'id' })
}

module.exports = {
  name: 'plugin-blive',
  apply,
}
