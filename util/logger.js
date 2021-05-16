const { Logger } = require('koishi-core')
const logger = new Logger('bilibili')
logger.log = logger.info
module.exports = { logger }
