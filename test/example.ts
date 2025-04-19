/**
 * Example test file for MCP server testing
 */

/**
 * Calculates the sum of an arbitrary number of numeric arguments
 * @param numbers - A sequence of numbers to be added
 * @returns The sum of all the numbers provided. Returns 0 if no arguments are given
 * @throws {TypeError} If any parameter is not a number
 * @example
 * // Returns 5
 * add(2, 3);
 * @example
 * // Returns 15
 * add(1, 2, 3, 4, 5);
 * @example
 * // Returns 0
 * add();
 */
function add(...numbers: number[]): number {
    // Validate all arguments are numbers
    if (numbers.some(n => typeof n !== 'number' || isNaN(n))) {
        throw new TypeError('All parameters must be valid numbers');
    }
    
    // Use reduce for efficient summation
    return numbers.reduce((sum, current) => sum + current, 0);
}

/**
 * Calculates the product of an arbitrary number of numeric arguments
 * @param numbers - A sequence of numbers to be multiplied
 * @returns The product of all the numbers provided. Returns 1 if no arguments are given
 * @throws {TypeError} If any parameter is not a number
 * @example
 * // Returns 6
 * multiply(2, 3);
 * @example
 * // Returns 120
 * multiply(1, 2, 3, 4, 5);
 * @example
 * // Returns 1
 * multiply();
 */
function multiply(...numbers: number[]): number {
    // Validate all arguments are numbers
    if (numbers.some(n => typeof n !== 'number' || isNaN(n))) {
        throw new TypeError('All parameters must be valid numbers');
    }
    
    // Use reduce for efficient multiplication
    return numbers.reduce((product, current) => product * current, 1);
}

export { add, multiply };
