function format (tpl = '', data) {
  return typeof data === 'object' ? Object.entries(data)
    .reduce((tpl, [ dataKey, dataVal ]) => {
      return tpl.replace(new RegExp(`\\[${dataKey}\\]`, 'g'), `${dataVal}`)
    }, tpl)
    : tpl
}

module.exports = function interpolate (tpl, data = {}) {
  if (typeof tpl === 'string') {
    return format(tpl, data)
  }

  if (Array.isArray(tpl)) {
    return tpl.map(item => interpolate(item, data))
  }

  if (typeof tpl === 'object') {
    return Object.entries(tpl)
      .reduce((newObj, [ key, value ]) => {
        newObj[key] = interpolate(value, data)
        return newObj
      }, {})
  }

  return tpl
}
