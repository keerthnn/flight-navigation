"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAirportRefreshJob = scheduleAirportRefreshJob;
const logger_1 = require("../config/logger");
function scheduleAirportRefreshJob() {
    logger_1.logger.info('Airport refresh job registered; production deployments should wire this to an external scheduler.');
}
