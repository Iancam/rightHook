import { Grammar } from "./utils";
import { Chrono } from "chrono-node";
import { parse } from "./utils";
// import _ from "lodash";

const cmd =
  'strm d todo "ithaka: ww: tool maintenance@ian @isaac {next thursday}"';

const todoGrammar: Grammar = {
  category: /(\w+): /g,
  person: /@(\w+)[ \n$]/g,
  when: text => new Chrono().parse(text, new Date()).map(v => v.start.date())
};

const userVals: { [key in keyof Grammar]: any[] } = parse(todoGrammar, cmd);
