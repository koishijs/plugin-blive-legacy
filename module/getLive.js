const { default: axios } = require('axios')

async function getLiveInit(roomid) {
  const { data } = await axios.get(
    'https://api.live.bilibili.com/room/v1/Room/room_init',
    {
      params: { id: roomid },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
      },
    }
  )
  return data?.data
}

async function getLiveMaster(uid) {
  const { data } = await axios.get(
    'https://api.live.bilibili.com/live_user/v1/Master/info',
    {
      params: { uid },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
      },
    }
  )
  return data?.data
}

async function getLiveInfo(uid) {
  const { data } = await axios.get(
    'https://api.live.bilibili.com/room/v1/Room/getRoomInfoOld',
    {
      params: { mid: uid },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
        Cookie: `LIVE_BUVID=${Math.random()}`,
      },
    }
  )
  return data?.data
}

async function getLiveDetailsByUid(uid) {
  const [liveDetails, liveMaster] = await Promise.all([
    getLiveInfo(uid),
    getLiveMaster(uid),
  ])

  if (!liveDetails.roomid || liveDetails.roomid === 0) return null

  const {
    roomStatus,
    liveStatus,
    url,
    title,
    cover,
    online,
    roomid,
  } = liveDetails
  const { medal_name, room_news, follower_num } = liveMaster
  const { uname: username } = liveMaster.info

  const { live_time } = await getLiveInit(roomid)
  return {
    uid,
    username,
    roomStatus,
    liveStatus,
    url,
    title,
    cover,
    online,
    roomid,
    medalName: medal_name,
    roomNews: room_news,
    followerNum: follower_num,
    liveTime: live_time * 1000,
  }
}

module.exports = {
  getLiveInit,
  getLiveInfo,
  getLiveMaster,
  getLiveDetailsByUid,
}
