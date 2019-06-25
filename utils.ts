import _ from "lodash";

export const parse = (grammar: Grammar, text: string) => {
  return _.mapValues(grammar, val => {
    return val instanceof RegExp ? text.match(val) : val(text);
  });
};

export type Grammar = { [x: string]: ((text: string) => any) | RegExp };
