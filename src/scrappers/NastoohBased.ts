import { clsScrapper } from "../modules/clsScrapper";
import { enuDomains, enuMajorCategory, enuMinorCategory, enuSubMinorCategory, IntfMappedCatgory, IntfProcessorConfigs, IntfProxy } from "../modules/interfaces";
import { HTMLElement } from "node-html-parser"
import deepmerge from "deepmerge";
import { getArvanCookie } from "../modules/request";

class clsNastoohBased extends clsScrapper {
    constructor(domain: enuDomains, baseURL: string, conf?: IntfProcessorConfigs) {
        const baseConfig: IntfProcessorConfigs = {
            selectors: {
                article: "article",
                aboveTitle: ".rutitr, .kicker",
                title: ".title",
                subtitle: ".introtext",
                summary: ".item-summary",
                content: {
                    main: '.item-body .item-text>*, .introtext+figure, .item-header+figure, section.photoGall li, .item-text .gallery figure, .item-summary figure',
                    alternative: '.item-body>*',
                    textNode: ".item-body .item-text"
                },
                comments: {
                    container: ".comments-list li",
                    datetime: ".date",
                    author: ".author",
                    text: ".comment-body"
                },
                tags: (article: HTMLElement) => article.querySelector('.tags')?.querySelectorAll('li'),
                datetime: {
                    conatiner: '.item-date>span',
                    splitter: "-"
                },
                category: {
                    selector: (article: HTMLElement) => article.querySelector(".breadcrumb")?.querySelectorAll("li"),
                    startIndex: 0,
                }
            },
            url: {
                extraInvalidStartPaths: ["/old/upload", '/d/'],
                pathToCheckIndex:1,
            }
        }
        super(domain, baseURL, deepmerge(baseConfig, conf || {}))
    }
}

/***********************************************************/
export class hamshahrionline extends clsNastoohBased {
    constructor() {
        super(enuDomains.hamshahrionline, "hamshahrionline.ir", {
            selectors: {
                article: ".main-content"
            }
        })
    }
}

/***********************************************************/
export class irna extends clsNastoohBased {
    constructor() {
        super(enuDomains.irna, "irna.ir", { selectors: { datetime: { splitter: "،" } } })
    }

    async initialCookie(proxy?: IntfProxy, url?: string) {
        return await getArvanCookie(url || "https://www.irna.ir", this.baseURL, proxy)
    }

    
    mapCategory(cat? :string) : IntfMappedCatgory{
        if (!cat) return { major: enuMajorCategory.News }
        const catParts = cat.split('/')
        const first = catParts[0]
        const second = catParts.length > 1 ? catParts[1] : ''

        if (first.startsWith("ورزش") || second.startsWith("جام جهانی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport }
        else if (first.startsWith("جامعه")|| second.includes("اجتماعی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social }
        else if (cat.includes("اقتصاد")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Economics }
        else if (first.includes("بهداشت")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Health }
        else if (cat.includes("عکس") || cat.includes("فیلم") || cat.includes("ویدئو") || cat.includes("ویڈیو")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Multimedia }
        else if (first.startsWith("جهان") || second.startsWith("سیاست خارجی") || cat.includes("بین")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        else if (cat.includes("آموزش") || cat.includes("دانشگاه")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Education }
        else if (second.includes("ایران‌شناسی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture }
        else if (first.includes("علم")) return { major: enuMajorCategory.News, minor: enuMinorCategory.ScienceTech }
        else if (first.startsWith("فرهنگ") && second.startsWith("کتاب")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Literature }
        else if (first.startsWith("فرهنگ") && second.startsWith("سینما")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
        else if (first.includes("فرهنگ")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture }
        else if (cat.includes("سبک زندگی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.LifeStyle }
        else if (first.startsWith("سیاست") || second.includes("سیاسی") || first.startsWith("پژوهش") || first.startsWith("صفحات") || second.startsWith("خبر")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political }
        else if (first.startsWith("استان")) return { major: enuMajorCategory.News, subminor: enuMinorCategory.Local }

        return { major: enuMajorCategory.News }
    }
}

/***********************************************************/
export class mashreghnews extends clsNastoohBased {
    constructor() {
        super(enuDomains.mashreghnews, "mashreghnews.ir", {
            selectors: {
                comments: {
                    container: (_: HTMLElement, fullHtml: HTMLElement) => {
                        return fullHtml.querySelectorAll(".comments li")
                    }
                }
            }
        })
    }

    mapCategory(cat?: string): IntfMappedCatgory {
        if (!cat) return { major: enuMajorCategory.News }

        if (cat.startsWith("سیاست") 
            || cat.startsWith("جهاد") 
            || cat.startsWith("دهه فجر") 
            || cat.startsWith("ویژه‌نامه")
            || cat.startsWith("انتخابات")
            || cat.startsWith("گزارش")
            || cat.startsWith("دیدگاه")
            || cat.startsWith("جنگ نرم")
            || cat.startsWith("بهارستان نهم")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political }
        else if (cat.includes("دفاع")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political, subminor: enuMinorCategory.Defence }
        else if (cat.startsWith("جامعه")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social }
        else if (cat.startsWith("اقتصاد")
            || cat.startsWith("بازار") 
            || cat.startsWith("بورس")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Economics }
        else if (cat.startsWith("عکس") || cat.startsWith("فیلم")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Multimedia }
        else if (cat.startsWith("جهان") || cat.startsWith("تحولات منطقه") || cat.startsWith("انتخابات امریکا")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        else if (cat.startsWith("محور مقاومت")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political }
        else if (cat.startsWith("جام جهانی") || cat.startsWith("یورو")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Intl }
        else if (cat.startsWith("ورزش")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport }
        else if (cat.includes("سینما")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
        else if (cat.startsWith("فرهنگ")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture }
        else if (cat.startsWith("تاریخ")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Historical }
        else if (cat.startsWith("دین") || cat.includes("حسینیه")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Religious }
        else if (cat.startsWith("وبلاگستان")) return { major: enuMajorCategory.Weblog, minor: enuMinorCategory.Undefined }

        return { major: enuMajorCategory.News }
    }
}

/***********************************************************/
export class khabaronline extends clsNastoohBased {
    constructor() {
        super(enuDomains.khabaronline, "khabaronline.ir", {
            selectors: { content: { ignoreTexts: ["بیشتر بخوانید:"] } },
            url:{
                validPathsItemsToNormalize: ["news", "live", "photo", "media"]
            }
        })
    }

    textNodeMustBeIgnored(tag: HTMLElement, index: number, allElements: HTMLElement[]) {
        return index > allElements.length - 5
            && (tag.innerText.match(/^[۱۲۳۴۵۶۷۸۹۰1234567890]+$/) ? true : false)
    }
}

/***********************************************************/
export class mehrnews extends clsNastoohBased {
    constructor() {
        super(enuDomains.mehrnews, "mehrnews.com", {
            selectors: {
                datetime: {
                    splitter: (el: HTMLElement, fullHtml?: HTMLElement) => {
                        const photoPage = fullHtml?.querySelector("#photo")
                        return super.extractDate((photoPage?.querySelector(".item-date>span") || el), photoPage ? "-" : "،") || "DATE NOT FOUND"
                    }
                }
            }
        })
    }

    mapCategory(cat? :string) : IntfMappedCatgory{
        if (!cat) return { major: enuMajorCategory.News }
        const catParts = cat.split('/')
        const first = catParts[0]
        const second = catParts.length > 1 ? catParts[1] : ''

        if (second.startsWith("توپ")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Ball }
        else if (first.startsWith("هنر") && second.startsWith("سینما") || second.startsWith("جشنواره")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
        else if (first.startsWith("هنر") && second.startsWith("تئاتر")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Theatre }
        else if (first.startsWith("هنر") && second.includes("تلویزیون")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.TV }
        else if (first.startsWith("هنر") && second.startsWith("موسیقی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Music }
        else if (first.startsWith("هنر") && second.startsWith("کتاب")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Book }
        else if (first.startsWith("هنر")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Art } 
        else if (cat.includes("عکس")
         || cat.includes("فیلم")
         || cat.includes("اینفو")
         || cat.includes("دکه")
         || cat.includes("مهرکارتون")
         || cat.includes("گرافیک")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Multimedia }
        else if (second.startsWith("فوتبال")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Futbol }
        else if (second.startsWith("کشتی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Wrestling }
        else if (first.startsWith("ورزش") || second.startsWith("جام جهانی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport }
        else if (cat.includes("جامعه/حوادث")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social, subminor: enuSubMinorCategory.Accident }
        else if (first.startsWith("جامعه") && second.includes("حقوقی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social, subminor: enuMinorCategory.Law }
        else if (first.startsWith("جامعه") && second.includes("آموزش")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social, subminor: enuMinorCategory.Education }
        else if (first.startsWith("جامعه") || cat.includes("زندگی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social }
        else if (second.startsWith("گپ")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Talk }
        else if (cat.includes("دفاعی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political, subminor: enuMinorCategory.Defence }
        else if (first.startsWith("سلامت")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Health }
        else if (cat.includes("اقتصاد") || cat.includes("بازار")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Economics }
        else if (cat.includes("دانشگاه")) return { major: enuMajorCategory.News, minor: enuMinorCategory.University }
        else if (second.startsWith("سیاست خارجی") || cat.includes("بین") || cat.includes("دنیا")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        else if (cat.includes("آموزش")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social, subminor: enuMinorCategory.Education}
        else if (first.startsWith("دانش") || cat.includes("مجازی") || cat.includes("فجازی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.ScienceTech }
        else if (first.startsWith("فرهنگ") && second.startsWith("کتاب")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Book }
        else if (cat.includes("فرهنگ") || cat.includes("گردشگری")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture }
        else if (cat.includes("سیاست") || cat.includes("انتخابات") || cat.includes("خبر")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political }
        else if (first.startsWith("استان") || first.startsWith("ایران")) return { major: enuMajorCategory.News, subminor: enuMinorCategory.Local }
        else if (first.startsWith("دین")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Religious }
        else if (cat.includes("دور")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Generic }
        else if (cat.includes("رادیومهر")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Generic, subminor: enuSubMinorCategory.Radio }

        return { major: enuMajorCategory.News }
    }
}

/***********************************************************/
export class imna extends clsNastoohBased {
    constructor() {
        super(enuDomains.imna, "imna.ir",{
            url:{
                extraInvalidStartPaths: ["/d/"]
            }
        })
    }

    async initialCookie(proxy?: IntfProxy, url?: string) {
        return await getArvanCookie(url || "https://www.imna.ir", this.baseURL, proxy)
    }

    mapCategory(cat? :string) : IntfMappedCatgory{
        if (!cat) return { major: enuMajorCategory.News }
        const catParts = cat.split('/')
        const first = catParts[0]
        const second = catParts.length > 1 ? catParts[1] : ''

        if (first.startsWith("عکس") || first.startsWith("چند رسانه") ) return { major: enuMajorCategory.News, minor: enuMinorCategory.Multimedia }
        else if (first.startsWith("اقتصاد")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Economics }
        else if (first.startsWith("جامعه") && second.startsWith("سلامت")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social, subminor: enuMinorCategory.Health }
        else if (first.startsWith("جامعه")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Social }
        else if (first.startsWith("بین")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        else if (first.startsWith("سیاست")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political }
        else if (first.startsWith("فرهنگ") && second.includes("موسیقی") ) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Music }
        else if (first.startsWith("فرهنگ") && second.includes("دین") ) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Religious }
        else if (first.startsWith("فرهنگ") && second.includes("ادبیات") ) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Literature }
        else if (first.startsWith("فرهنگ") && second.includes("سینما") ) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
        else if (first.startsWith("فرهنگ")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture }
        else if (cat.includes("ورزش")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport }
        else if (first.startsWith("علم")) return { major: enuMajorCategory.News, minor: enuMinorCategory.ScienceTech }
        else if (cat.includes("شهر")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Local }
        else if (first.startsWith("ایمنا مگ")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Undefined }

        return { major: enuMajorCategory.News }
    }
}

/***********************************************************/
export class shana extends clsNastoohBased {
    constructor() {
        super(enuDomains.shana, "shana.ir", {
            selectors: {
                datetime: {conatiner: ".item-nav.row>div>span, .item-date"}
            },
            url: {
                extraInvalidStartPaths: ["/tender/"]
            }
        })
    }

    async initialCookie(proxy?: IntfProxy, url?: string) {
        return await getArvanCookie(url || "https://www.shana.ir", this.baseURL, proxy)
    }
}

/***********************************************************/
export class chtn extends clsNastoohBased {
    constructor() {
        super(enuDomains.chtn, "chtn.ir", {
            selectors: {
                article: ".main-content, #photo"
            },
            url:{
                extraInvalidStartPaths: ["/d/"]
            }
        })
    }

    mapCategory(cat?:string): IntfMappedCatgory {
        if (!cat) return {major: enuMajorCategory.News, minor: enuMinorCategory.Culture}

        const catParts = cat.split('/')
        const second = catParts.length > 1 ? catParts[1] : ''

        if (second.startsWith("فیلم")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Multimedia }
        else if (second.startsWith("سیاسی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political }
        else if (second.startsWith("عکس")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Multimedia }
        else if (second.startsWith("اقتصادی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Economics}
        else if (second.startsWith("ورزشی")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Sport }

        return {major: enuMajorCategory.News, minor: enuMinorCategory.Culture}
    }
}

/***********************************************************/
export class shahr extends clsNastoohBased {
    constructor() {
        super(enuDomains.shahr, "shahr.ir", {
            selectors: {
                aboveTitle: ".subtitle",
            }
        })
    }
}

/***********************************************************/
export class ibna extends clsNastoohBased {
    constructor() {
        super(enuDomains.ibna, "ibna.ir", {
            selectors: {
                article: "article",
                title: ".item-title",
                datetime: {
                    conatiner: ".item-date",
                    splitter: "-",
                }
            }
        })
    }

    mapCategory(cat? :string) : IntfMappedCatgory{
        if (!cat) return { major: enuMajorCategory.News }
        const catParts = cat.split('/')
        const second = catParts.length > 1 ? catParts[1] : ''

        if (second.startsWith("دین")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Religious }
        else if (second.startsWith("کودک") || second.startsWith("مدیریت") || second.startsWith("ادبیات") || second.startsWith("تازه")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Literature }
        else if (cat.includes("استان")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Literature, subminor: enuMinorCategory.Local }
        else if (cat.includes("چندرسانه")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Multimedia}
        else if (second.includes("هنر"))  return { major: enuMajorCategory.News, minor: enuMinorCategory.Literature, subminor: enuSubMinorCategory.Art }
        else if (second.startsWith("فرهنگ")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Culture }
        else if (second.includes("سیاست")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Political }

        return { major: enuMajorCategory.News }
    }
}

/***********************************************************/
export class hawzahnews extends clsNastoohBased {
    constructor() {
        super(enuDomains.hawzahnews, "hawzahnews.com", {
            selectors: {
                article: "div[id='main']",
                datetime: {
                    conatiner: '.item-date>span, .gallery-desc',
                    splitter: "-"
                },
                category: {
                    selector: (article: HTMLElement) => article.querySelector("ol.breadcrumb")?.querySelectorAll("li"),
                    startIndex: 0,
                }
            }
        })
    }
}