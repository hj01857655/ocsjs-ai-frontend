/**
 * 验证工具函数
 */

/**
 * 判断是否为外部链接
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * 验证用户名
 * @param {string} str
 * @returns {Boolean}
 */
export function validUsername(str) {
  const valid_map = ['admin', 'editor']
  return valid_map.indexOf(str.trim()) >= 0
}

/**
 * 验证邮箱
 * @param {string} email
 * @returns {Boolean}
 */
export function validEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

/**
 * 验证手机号
 * @param {string} phone
 * @returns {Boolean}
 */
export function validPhone(phone) {
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

/**
 * 验证URL
 * @param {string} url
 * @returns {Boolean}
 */
export function validURL(url) {
  const reg = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/
  return reg.test(url)
}

/**
 * 验证小写字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validLowerCase(str) {
  const reg = /^[a-z]+$/
  return reg.test(str)
}

/**
 * 验证大写字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validUpperCase(str) {
  const reg = /^[A-Z]+$/
  return reg.test(str)
}

/**
 * 验证字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validAlphabets(str) {
  const reg = /^[A-Za-z]+$/
  return reg.test(str)
}

/**
 * 验证密码强度
 * @param {string} password
 * @returns {Object}
 */
export function validatePassword(password) {
  const result = {
    valid: false,
    strength: 0,
    message: ''
  }

  if (!password) {
    result.message = '密码不能为空'
    return result
  }

  if (password.length < 6) {
    result.message = '密码长度至少6位'
    return result
  }

  if (password.length > 20) {
    result.message = '密码长度不能超过20位'
    return result
  }

  let strength = 0

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    strength++
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    strength++
  }

  // 包含数字
  if (/\d/.test(password)) {
    strength++
  }

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength++
  }

  result.strength = strength
  result.valid = strength >= 2

  if (strength === 1) {
    result.message = '密码强度：弱'
  } else if (strength === 2) {
    result.message = '密码强度：中'
  } else if (strength === 3) {
    result.message = '密码强度：强'
  } else if (strength === 4) {
    result.message = '密码强度：很强'
  }

  return result
}

/**
 * 验证身份证号
 * @param {string} idCard
 * @returns {Boolean}
 */
export function validIdCard(idCard) {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idCard)
}

/**
 * 验证IP地址
 * @param {string} ip
 * @returns {Boolean}
 */
export function validIP(ip) {
  const reg = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return reg.test(ip)
}

/**
 * 验证端口号
 * @param {string|number} port
 * @returns {Boolean}
 */
export function validPort(port) {
  const portNum = parseInt(port)
  return portNum >= 1 && portNum <= 65535
}

/**
 * 题目质量检测
 * @param {string} question 题目内容
 * @param {Object} parseResult 题目解析结果
 * @returns {Object} 质量检测结果
 */
export function checkQuestionQuality(question, parseResult = {}) {
  const issues = []
  let score = 5

  // 检查题目长度
  if (question.length < 10) {
    issues.push('题目内容过短，建议补充更多信息')
    score -= 1
  }

  // 检查是否有明确的问题
  if (!question.includes('？') && !question.includes('?')) {
    issues.push('题目缺少明确的问号，可能影响理解')
    score -= 0.5
  }

  // 检查是否有特殊字符
  if (/[^\u4e00-\u9fa5a-zA-Z0-9\s\.\?\！\(\)\[\]（）【】，。；：""''、]/g.test(question)) {
    issues.push('题目包含特殊字符，可能影响AI理解')
    score -= 0.5
  }

  // 检查重复词汇
  const words = question.split(/\s+/)
  const uniqueWords = new Set(words)
  if (words.length - uniqueWords.size > 3) {
    issues.push('题目存在较多重复词汇')
    score -= 0.5
  }

  // 根据题目类型提供特定建议
  if (parseResult.detected) {
    const suggestions = getQualitySuggestions(parseResult.type, question)
    issues.push(...suggestions)
  }

  return {
    checked: true,
    score: Math.max(1, score),
    issues
  }
}

/**
 * 根据题目类型获取质量建议
 * @param {string} type 题目类型
 * @param {string} question 题目内容
 * @returns {Array} 建议列表
 */
export function getQualitySuggestions(type, question) {
  const suggestions = []

  switch (type) {
    case 'single':
    case 'multiple':
      if (!question.includes('A.') && !question.includes('A、')) {
        suggestions.push('选择题建议使用标准的选项格式（A. B. C. D.）')
      }
      break

    case 'programming':
      if (!question.includes('要求') && !question.includes('实现')) {
        suggestions.push('编程题建议明确说明具体要求和实现目标')
      }
      break

    case 'calculation':
      if (!/[0-9]/.test(question)) {
        suggestions.push('计算题建议包含具体的数值或公式')
      }
      break

    case 'short_answer':
    case 'essay':
      if (question.length < 20) {
        suggestions.push('主观题建议提供更详细的背景信息')
      }
      break

    case 'case_study':
      if (!question.includes('案例') && !question.includes('材料')) {
        suggestions.push('案例分析题建议提供具体的案例背景')
      }
      break
  }

  return suggestions
}

/**
 * 获取质量评分文本
 * @param {number} score 质量分数
 * @returns {string} 评分文本
 */
export function getQualityText(score) {
  if (score >= 4.5) return '优秀'
  if (score >= 3.5) return '良好'
  if (score >= 2.5) return '一般'
  if (score >= 1.5) return '较差'
  return '很差'
}
