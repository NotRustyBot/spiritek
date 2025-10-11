import hyphenateStyleName from 'hyphenate-style-name';

export function createElement(tag: string | ((props: any) => HTMLElement), props: { [x: string]: any } & { style?: CSSStyleDeclaration }, ...children: any[]) {
    if (typeof tag === "function") {
        return tag(props);
    }

    const element = document.createElement(tag);

    for (const name in props) {
        if (name === 'style' && typeof props[name] === 'object') {
            const styleObj = props[name];
            for (const styleProp in styleObj) {
                const cssProperty = styleProp.replace(/([A-Z])/g, '-$1').toLowerCase();
                element.style.setProperty(cssProperty, styleObj[styleProp]);
            }
        } else if (name.startsWith("on")) {
            element.addEventListener(name.substring(2).toLowerCase(), (e) => props[name](e));
        } else if (name == "ref") {
            props["ref"](element);
        } else {
            element.setAttribute(name, props[name]);
        }
    }

    children.flat().forEach((child) => {
        if (typeof child === "string") {
            element.appendChild(document.createTextNode(child));
        } else if (child != undefined) {
            element.appendChild(child);
        }
    });

    return element;
}

export class CssRuler {
    static reference?: HTMLStyleElement;

    static getReference() {
        if (!CssRuler.reference) {
            CssRuler.reference = document.createElement("style");
            document.head.appendChild(CssRuler.reference);
        }
        return CssRuler.reference;
    }

    static addRule(selector: string, style: CSSStyleDeclaration | Record<string, string>) {
        const cssText = jsToCss(style as Record<string, string>); // Convert JS style to CSS string
        const rule = `${selector} { ${cssText} }`;

        const sheet = CssRuler.getReference().sheet;
        if (sheet) {
            sheet.insertRule(rule, sheet.cssRules.length);
        }
    }

    static addRawCss(css: string) {
        const styleElement = CssRuler.getReference();
        styleElement.textContent += css;
    }
}

function jsToCss(style: Record<string, string>): string {
    return Object.entries(style)
        .map(([key, value]) => `${hyphenateStyleName(key)}: ${value};`)
        .join(' ');
}

export const CSS: { [key: string]: (style: CSSStyleDeclaration | Record<string, string>) => void } = new Proxy({}, {
    get: (target, prop) => {
        if (typeof prop === 'symbol') {
            throw new Error('Cannot access symbol property');
        }
        return (style: CSSStyleDeclaration) => {
            CssRuler.addRule(prop, style);
        };
    }
});

export const color = {
    primary: '#99aaff',
    primaryActive: '#6699ff',
    background: '#111111',
    bgInteractive: '#222222',
    bgActive: '#335577',
    border: '#444444',
    green: '#00ff00',
    red: '#ff0000',
};