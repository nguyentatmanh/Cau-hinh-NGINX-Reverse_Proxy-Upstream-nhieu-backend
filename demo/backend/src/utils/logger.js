/**
 * utils/logger.js - Bộ ghi log chi tiết phục vụ giảng dạy & minh họa cơ chế Reverse Proxy
 * In ra terminal: Peer Socket IP vs Client IP nhận qua Forwarded Headers
 */
function requestLogger(instanceId) {
    return (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const peerIp = req.socket.remoteAddress || 'unknown';
            const host = req.headers['host'] || 'none';
            const xRealIp = req.headers['x-real-ip'] || 'none';
            const xForwardedFor = req.headers['x-forwarded-for'] || 'none';
            const xForwardedProto = req.headers['x-forwarded-proto'] || 'none';

            console.log(
                `[BACKEND ${instanceId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms) | ` +
                `Peer IP: ${peerIp} | Host: ${host} | X-Real-IP: ${xRealIp} | ` +
                `X-Forwarded-For: ${xForwardedFor} | X-Forwarded-Proto: ${xForwardedProto}`
            );
        });
        next();
    };
}

module.exports = {
    requestLogger
};
