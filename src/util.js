const randomNumb = (min = 0, max = 20) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    randomNumb
}