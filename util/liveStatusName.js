function liveStatusName(status) {
  switch (status) {
    case 0:
      return '未开播'
    case 1:
      return '直播中'
    case 2:
      return '轮播中'
  }
}

module.exports = {
  liveStatusName,
}
