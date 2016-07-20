let paths = {
    "lib": `${__dirname}`,
    "root": `${__dirname}/..`
};

/**
 * take option
 * @param {Object} ev - handle event.
 */
export function onHandleConfig(ev) {
    if (typeof ev.data.config["styles"] !== "object") {
        ev.data.config.styles = [];
    }

    ev.data.config.styles.push(`${paths.root}/hacker-vision.css`);
}
