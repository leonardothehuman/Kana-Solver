/*This file is licensed under GNU GPL v3.0 only license*/

import {PrefixMap} from "../minilibs/parsers/prefix_map";
import iconv from 'iconv-lite';
import fs from "fs";

let prefix_map = fs.readFileSync(process.argv[2]);

let prefixMap = new PrefixMap(iconv.decode(prefix_map, "SHIFT_JIS"));

prefixMap.test();