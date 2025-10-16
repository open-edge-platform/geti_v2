export const validateColor = (input: string | undefined) => {
    const validatedColor = input?.split('#')[1];
    if (!validatedColor) {
        return '#000000';
    } else if (validatedColor.length === 3) {
        //eslint-disable-next-line max-len
        return `#${validatedColor[0]}${validatedColor[0]}${validatedColor[1]}${validatedColor[1]}${validatedColor[2]}${validatedColor[2]}`;
    } else if (/^#[0-9A-F]{6}$/i.test(input)) {
        return input;
    }
    return `#${'0'.repeat(6 - validatedColor.length)}${validatedColor}`;
};
