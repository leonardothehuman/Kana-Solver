import {zipNormalize} from "../minilibs/helpers";

console.log("\""+zipNormalize("/aaa/bb/cc\\dd\\")+"\"");

console.log("\""+zipNormalize("   /   /   /  aa f a\\bb / cc/dd/   /    /   ")+"\"");

console.log("\""+zipNormalize("")+"\"");

console.log("\""+zipNormalize("/")+"\"");
console.log("\""+zipNormalize("\\")+"\"");
console.log("\""+zipNormalize("    / f  /  ")+"\"");
console.log("\""+zipNormalize("    /")+"\"");
console.log("\""+zipNormalize("/    ")+"\"");
console.log("\""+zipNormalize("c")+"\"");
console.log("\""+zipNormalize("      d    ")+"\"");


console.log("\""+zipNormalize("     c/d    ")+"\"");

console.log("\""+zipNormalize("     c / y d    ")+"\"");
console.log("\""+zipNormalize("     c /  /  / y d    ")+"\"");
console.log("\""+zipNormalize("Hello world")+"\"");

console.log("\""+zipNormalize("   j  /   c /./../.../..../... y d    ")+"\"");
console.log("\""+zipNormalize("   j  /   c /./../..././../..../... y d    ")+"\"");
console.log("\""+zipNormalize("     c /... you are dead .../... y d    ")+"\"");

console.log("\""+zipNormalize("     c / y d / ff    ")+"\"");

console.log("\""+zipNormalize("     c /... you are dead .../... y d    /../../../../../../../../../../")+"\"");
console.log("\""+zipNormalize("../../../../../../../../../../..     c / y d / ff    ")+"\"");

console.log("\""+zipNormalize("   j  /   c /..././../..../... y d    ")+"\"");
console.log("\""+zipNormalize("   j  /   c /..././..../... y d    ")+"\"");