import mergeWith from "lodash/mergeWith";
import isArray from "lodash/isArray";

const deep = (a: Object, b: Object) => {
  if (isArray(a) && isArray(b)) {
    return a.concat(b);
  }
};

export default function (a: Object, b: Object) {
  return mergeWith(a, b, deep);
}
