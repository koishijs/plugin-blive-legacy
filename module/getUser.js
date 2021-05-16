const { default: axios } = require('axios')

async function getUserById(mid) {
  const { data } = await axios.get(
    'https://api.bilibili.com/x/space/acc/info',
    {
      params: { mid },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
      },
    }
  )
  if (data.code !== 0) throw data
  return data.data
}

async function getUsersByName(keyword) {
  const { data } = await axios.get(
    'https://api.bilibili.com/x/web-interface/search/type',
    {
      params: { keyword, search_type: 'bili_user' },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
      },
    }
  )
  return data?.data?.result || []
}

module.exports = {
  getUserById,
  getUsersByName,
}
