const _ = require("lodash");

// eslint-disable-next-line no-extend-native
String.prototype.fill = function (data) {
  let str = this;
  const regex = /{{[\s|\s+]?([^}]+)[\s|\s+]?}}/g;
  const matches = str.match(regex) || [];

  for (const match of matches) {
    const key = String(match.replace(regex, "$1")).trim();
    str = str.replace(match, _.get(data, key, key));
  }

  return String(str);
};

module.exports = {};
