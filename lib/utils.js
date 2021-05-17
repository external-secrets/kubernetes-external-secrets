const yaml = require('js-yaml')
const parseTemplate = require('lodash/template')
const mapValues = require('lodash/mapValues')

const compileTemplate = (template, data) => parseTemplate(template, { imports: { yaml }, variable: 'data' })(data)

const compileObjectTemplateKeys = (object, data) => {
  return mapValues(object, (value) => {
    if (value) {
      const valueType = typeof value

      if (valueType === 'string') {
        return compileTemplate(value, data)
      } else if (valueType === 'object' && !Array.isArray(value)) {
        return compileObjectTemplateKeys(value, data)
      }
    }

    return value
  })
}

module.exports = {
  compileTemplate,
  compileObjectTemplateKeys
}
