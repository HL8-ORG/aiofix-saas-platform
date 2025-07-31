/**
 * @constant SALT_ROUNDS
 * @description
 * 密码加密时使用的盐轮数（salt rounds），用于bcrypt等哈希算法中增强密码安全性。
 *
 * 代码原理与机制说明：
 * 1. 盐轮数决定了哈希算法在加密时的迭代次数，数值越大，计算复杂度越高，破解难度也随之提升。
 * 2. 在用户注册或修改密码时，系统会使用该常量作为参数，调用bcrypt等库生成加盐哈希后的密码，
 *    防止明文密码泄露和暴力破解。
 * 3. 该常量统一配置，便于后续根据安全需求灵活调整加密强度，提升系统整体安全性。
 */
export const SALT_ROUNDS = 10;

/**
 * 请求ID头部字段名
 * @description 用于从HTTP头中获取或设置请求ID
 */
export const REQUEST_ID_HEADER = 'x-request-id';