

exports.capitalizeSentence = (sentence) =>(
    sentence
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (match) => match.toUpperCase())
);