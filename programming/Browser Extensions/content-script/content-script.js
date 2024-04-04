function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

let el = getElementByXpath("//body/div/div[position()=2]");
let to_insert = "<p>ChatGPT doesn't cut it anymore, huh?</p>";
el.innerHTML += to_insert;
console.log("Element inserted successfully.");