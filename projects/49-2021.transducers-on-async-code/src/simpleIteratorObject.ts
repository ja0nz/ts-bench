
// count 20
export const count20 = {
    *[Symbol.iterator]() {
        let step = 0;
        while (true) {
            step++;
            if (step <= 20) {
                yield step; // Autowarpping in { value, done }
            } else {
                return "end"; // Finish with return instead of yield
            }
        }
    }
};

function* count3() {
    yield 1;
    yield 2;
    yield 3;
}
