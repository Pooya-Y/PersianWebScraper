import { clsScrapper } from "../modules/clsScrapper";
import { IntfProxy, enuDomains, IntfComment, enuMajorCategory, enuMinorCategory, enuSubMinorCategory, IntfMappedCategory, enuTextType } from "../modules/interfaces";
import HP, { HTMLElement } from "node-html-parser"
import { axiosGet, axiosPost, getArvanCookie, IntfRequestParams } from "../modules/request";
import { log } from "../modules/logger";
import { normalizeText, dateOffsetToDate, isIranProvinceString } from "../modules/common";

export class farsnews extends clsScrapper {
    constructor() {
        super(enuDomains.farsnews, "farsnews.ir", {
            selectors: {
                article: ".news-box, .gallery, .top-video .text",
                title: ".title",
                summary: ".lead",
                content: {
                    main: ".nt-body>*, .top figure",
                    alternative: ".row.photos img",
                    textNode: '.nt-body'
                },
                comments: async (url: URL, reqParams: IntfRequestParams): Promise<IntfComment[]> => {
                    return await axiosPost(log,
                        { "storyCode": url.pathname.split("/")[2] },
                        {
                            ...reqParams,
                            url: "https://www.farsnews.ir/api/getcomments",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                            },
                            onSuccess: (res: any) => {
                                const comments: IntfComment[] = []
                                res?.forEach((item: any) => {
                                    comments.push({
                                        text: item.text,
                                        author: item.name,
                                        date: this.extractDate(item.persianCreateDate, "-")
                                    })
                                    item.children?.forEach((child: any) => {
                                        comments.push({
                                            text: normalizeText(child.text) || "",
                                            author: normalizeText(child.name) || "",
                                            date: this.extractDate(child.persianCreateDate, "-")
                                        })
                                    })
                                })
                                return comments
                            },
                            onFail: (e) => { log.error(e) }
                        }
                    )
                },
                tags: ".tags .radius",
                datetime: {
                    conatiner: ".publish-time, .data-box span:nth-child(3)",
                },
                category: {
                    selector: (article: HTMLElement) => {
                        const categories = article.querySelectorAll(".category-name a");
                        return categories.length ? categories : article.querySelectorAll(".subject-category")
                    },
                }
            },
            url: {
                extraInvalidStartPaths: ["/newstext", "/printable", "/af", "/api"],
                validPathsItemsToNormalize: ["news", "media"],
                pathToCheckIndex: 1,
                extraValidDomains: ["farsnews.com"]
            },
        })
    }

    protected normalizePath(url: URL): string {
        const u = this.safeCreateURL(super.normalizePath(url))
        u.hostname = "www.farsnews.ir"
        u.protocol = "https:"
        return u.toString()
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (first.startsWith("اخبار"))
            first = first.substring(6).trim()

        if (first.startsWith("استان") || isIranProvinceString(first))
            return { ...mappedCat, minor: enuMinorCategory.Local }
        if (first.startsWith("فوتبال"))
            return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Football }
        if (first.startsWith("رالی"))
            return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Car }
        if (first.startsWith("کشتی"))
            return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Wrestling }
        if (first.startsWith("سیاست خارجی") || first.includes("الملل"))
            return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        if (first.startsWith("سیاست"))
            return { ...mappedCat, minor: enuMinorCategory.Political }
        if (first.startsWith("اقتصاد"))
            return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (first.startsWith("سینما"))
            return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
        if (first.startsWith("کتاب"))
            return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Book }
        if (first.startsWith("سفر "))
            return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Tourism }
        if (first.startsWith("نرخ") || first.startsWith("واحد"))
            return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (first.includes("فضای مجازی"))
            return { ...mappedCat, minor: enuMinorCategory.IT }

        if (false
            || first.startsWith("چندرسانه‌ای")
            || first.startsWith("عکس")
            || first.startsWith("ویدیو")
            || first.startsWith("ویدئو")
            || first.startsWith("تصویر")
            || first.startsWith("کاریکاتور")
        ) return { ...mappedCat, minor: enuMinorCategory.Multimedia }

        if (first.includes("اجتماعی") || first.startsWith("جامعه") || first.startsWith("محیط") || first.includes("شهروند"))
            mappedCat.minor = enuMinorCategory.Social
        else if (first.includes("اقتصادی")
            || first.includes("پولی")
            || first.includes("قیمت")
            || first.includes("تولید")
            || first.includes("بازار")
            || first.includes("مالیات")
            || first.includes("اشتغال")
            || first.includes("بورس")
            || first.includes("بیمه")
            || first.includes("نفت")
            || first.includes("خودرو")
            || first.includes("ارز ")
            || first.includes(" سکه ")
            || first.includes("سکه ")
            || first.includes(" سکه")
            || first.includes("بازرگانی")
            || first.includes("حمل ")
            || first.includes("کارگری")
        )
            mappedCat.minor = enuMinorCategory.Economics
        else if (first.includes("فرهنگ") || first.includes("رسانه") || first.includes("هنری"))
            mappedCat.minor = enuMinorCategory.Culture
        else if (first.includes("المپیک") || first.includes("ورزش") || first.includes("جام جهانی") || first.includes("باشگاهی"))
            mappedCat.minor = enuMinorCategory.Sport
        else if (first.includes("زندگی") || first.includes("آشپزی") || first.includes("زیبایی"))
            mappedCat.minor = enuMinorCategory.LifeStyle
        else if (first.includes("کنکور"))
            mappedCat.minor = enuMinorCategory.Education
        else if (first.includes("دانشگاه"))
            mappedCat.minor = enuMinorCategory.University
        else if (first.includes("سلامت"))
            mappedCat.minor = enuMinorCategory.Health
        else if (first.includes("حوادث") || first.includes("زورگیری"))
            return { ...mappedCat, minor: enuMinorCategory.Social, subminor: enuSubMinorCategory.Accident }
        else if (first.includes("سفر"))
            return { ...mappedCat, minor: enuMinorCategory.LifeStyle, subminor: enuMinorCategory.Tourism }
        else if (first.includes("قضایی"))
            return { ...mappedCat, minor: enuMinorCategory.Law }
        else if (first.includes("سلبریتی") || first.includes("آرامش"))
            mappedCat.minor = enuMinorCategory.LifeStyle
        else if (first.includes("سرگرمی") || first.includes("فال "))
            mappedCat.minor = enuMinorCategory.Fun
        else if (first.includes("پاسخ"))
            mappedCat.minor = enuMinorCategory.Talk
        else if (first.includes("حقوق"))
            mappedCat.minor = enuMinorCategory.Law
        else if (first.includes("انتخابات") || first.includes("جنبش عدم تعهد") || first.includes("سیاسی"))
            mappedCat.minor = enuMinorCategory.Political
        else if (first.includes("الملل")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        else if (first.includes("تکنولوژی") || first.includes("فناوری") || first.includes("علم") || first.includes("دانش")) mappedCat.minor = enuMinorCategory.ScienceTech

        if (second.includes("انتخابات")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Political; else mappedCat.minor = enuMinorCategory.Political
        } else if (second.includes("آموزش")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Education; else mappedCat.minor = enuMinorCategory.Education
        } else if (second.includes("قرآن") || second.includes("قران")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Religious; else mappedCat.minor = enuMinorCategory.Religious
        } else if (second.includes("زندگی")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.LifeStyle; else mappedCat.minor = enuMinorCategory.LifeStyle
        } else if (second.includes("اقتصاد")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Economics; else mappedCat.minor = enuMinorCategory.Economics
        } else if (second.includes("قضایی")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Law; else mappedCat.minor = enuMinorCategory.Law
        } else if (second.includes("جامعه") || second.includes("شهری") || second.includes("محیط")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Social; else mappedCat.minor = enuMinorCategory.Social
        } else if (second.includes("سلامت")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Health; else mappedCat.minor = enuMinorCategory.Health
        } else if (second.includes("آشپزی")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Cooking; else mappedCat.minor = enuMinorCategory.Cooking
        } else if (second.includes("حوادث")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.Accident; else mappedCat.minor = enuMinorCategory.Social
        } else if (second.includes("دفاع") || second.includes("نظامی")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Defence; else mappedCat.minor = enuMinorCategory.Defence
        } else if (second.includes("کتاب")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.Book; else mappedCat.minor = enuMinorCategory.Culture
        } else if (second.includes("تلویزیون")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.TV; else mappedCat.minor = enuMinorCategory.Culture
        } else if (second.includes("سینما")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.Cinema; else mappedCat.minor = enuMinorCategory.Culture
        } else if (second.includes("انرژی") || second.includes("نفت")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.Energy; else mappedCat.minor = enuMinorCategory.ScienceTech
        } else if (second.includes("کشاورزی")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.Agriculture; else mappedCat.minor = enuMinorCategory.ScienceTech
        } else if (second.includes("دانشگاه")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.University; else mappedCat.minor = enuMinorCategory.University
        } else if (second.includes("تکنولوژی") || second.includes("فناوری") || second.includes("علم") || second.includes("دانش")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.ScienceTech; else mappedCat.minor = enuMinorCategory.ScienceTech
        } else if (second.includes("هنر")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.Art; else mappedCat.minor = enuMinorCategory.Culture
        } else if (second.includes("موسیقی")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.Music; else mappedCat.minor = enuMinorCategory.Culture
        } else if (second.includes("مذهبی")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Religious; else mappedCat.minor = enuMinorCategory.Culture
        } else if (second.includes("تاریخی")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Historical; else mappedCat.minor = enuMinorCategory.Historical
        } else if (second.includes("گردشگری") || second.includes("سفر")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Tourism; else mappedCat.minor = enuMinorCategory.Culture
        } else if (second.includes("المپیک") || second.includes("ورزش") || second.includes("جام جهانی") || second.includes("باشگاهی")) {
            if (mappedCat.minor) mappedCat.subminor = enuMinorCategory.Sport; else mappedCat.minor = enuMinorCategory.Sport
        } else if (second.includes("گالری")) {
            if (mappedCat.minor) mappedCat.subminor = enuSubMinorCategory.Art; else mappedCat.minor = enuMinorCategory.Culture
        } else if (second.includes("رالی")) {
            mappedCat.minor = enuMinorCategory.Sport
            mappedCat.subminor = enuSubMinorCategory.Car
        } else if (second.includes("فوتبال")) {
            mappedCat.minor = enuMinorCategory.Sport
            mappedCat.subminor = enuSubMinorCategory.Football
        } else if (second.includes("رزمی")) {
            mappedCat.minor = enuMinorCategory.Sport
            mappedCat.subminor = enuSubMinorCategory.Martial
        } else if (second.includes("کشتی")) {
            mappedCat.minor = enuMinorCategory.Sport
            mappedCat.subminor = enuSubMinorCategory.Wrestling
        }
        return mappedCat
    }
}

export class alef extends clsScrapper {
    constructor() {
        super(enuDomains.alef, "alef.ir", {
            selectors: {
                article: "article",
                title: ".post-title",
                subtitle: ".post-lead",
                content: {
                    main: ".post-content>*, header img",
                    textNode: '.post-content',
                    ignoreTexts: [/.*tavoos_init_player.*/]
                },
                comments: {
                    container: (_: HTMLElement, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".comment"),
                    datetime: ".comment-date",
                    author: ".comment-author",
                    text: ".comment-text"
                },
                tags: ".post-tag",
                datetime: {
                    conatiner: ".post-sous time",
                    splitter: (el: HTMLElement) => super.extractDate(el, el.classList.contains("comment-date") ? " " : "،") || "DATE NOT FOUND",
                },
                category: {
                    selector: (_: HTMLElement, fullHtml: HTMLElement) => {
                        const category = fullHtml.querySelector(".navbar-nav .nav-item.active")?.innerText.replace("(current)", "")
                        if (!category) return []
                        return HP.parse(`<div>${category}</div>`).querySelectorAll("*")
                    }
                }
            },
        })
    }

    async initialCookie(proxy?: IntfProxy, url?: string) {
        return await getArvanCookie(url || "https://www.alef.ir", this.baseURL, proxy)
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (cat.startsWith("سیاسی")) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (cat.startsWith("اجتماعی")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (cat.startsWith("سلامت")) return { ...mappedCat, minor: enuMinorCategory.Health }
        if (cat.startsWith("اقتصادی")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (cat.startsWith("یادداشت بینندگان")) return { ...mappedCat, minor: enuMinorCategory.Discussion }
        if (cat.startsWith("فرهنگی")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (cat.startsWith("کتاب")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (cat.startsWith("جهان")) return { ...mappedCat, minor: enuMinorCategory.Generic, subminor: enuSubMinorCategory.Intl }
        if (cat.startsWith("ورزشی")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (cat.startsWith("ویدئو")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (cat.startsWith("عکس")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (cat.startsWith("حوادث")) return { ...mappedCat, minor: enuMinorCategory.Generic, subminor: enuSubMinorCategory.Accident }
        if (cat.startsWith("بازار")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (cat.startsWith("فناوری")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }

        return mappedCat
    }
}

export class isna extends clsScrapper {
    constructor() {
        super(enuDomains.isna, "isna.ir", {
            selectors: {
                article: "article",
                aboveTitle: ".kicker",
                title: ".first-title",
                summary: ".summary",
                content: {
                    main: ".item-body .item-text>*, .photoGall li",
                    alternative: (article: HTMLElement) => {
                        if (article.querySelector("section.gallery")) {
                            const element = article.querySelector("time")?.nextElementSibling
                            if (element) return [element]
                        }
                        return []
                    },
                    textNode: '.item-text',
                    ignoreTexts: ["بیشتر:"]
                },
                comments: {
                    container: ".comments .comment",
                    datetime: ".date-comment",
                    author: ".comment-name",
                    text: "p"
                },
                tags: ".tags li",
                datetime: {
                    conatiner: ".meta-news li:nth-child(1) .text-meta, time",
                    splitter: (el?: HTMLElement) => {
                        return super.extractDate(el, (el?.classList.contains("text-meta") || el?.tagName === "TIME" ? "/" : " ")) || "DATE NOT FOUND"
                    },
                },
                category: {
                    selector: ".meta-news li:nth-child(2) .text-meta",
                }
            },
            url: {
                pathToCheckIndex: 1,
            }
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (cat.startsWith("اجتماعی") || cat.startsWith("جامعه") || cat.startsWith("خانواده") || cat.startsWith("محیط")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (cat.includes("دانشگاه") || cat.includes("دانشجو")) return { ...mappedCat, minor: enuMinorCategory.University }
        if (cat.includes("علم")
            || cat.includes("دانش")
            || cat.includes("پژوهش")
        ) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
        if (cat.startsWith("انرژی هسته")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        if (cat.startsWith("اقتصاد")
            || cat.includes("تجارت") || cat.startsWith("انرژی") || cat.startsWith("عمران")
            || cat.startsWith("استخدام")
            || cat.includes("بازار") || cat.startsWith("ترین")
            || cat.startsWith("تمدن‌سازی")
            || cat.startsWith("مردمی‌سازی")
            || cat.startsWith("امید و آگاهی")
            || cat.startsWith("الگوی پیشرفت")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (cat.startsWith("آمریکا")
            || cat.includes("خارجی")
            || cat.startsWith("غرب")
            || cat.includes("ایران در جهان")
            || cat.includes("اقیانوسیه")
            || cat.startsWith("انرژی هسته")
            || cat.startsWith("بین الملل")
            || cat.includes("تحلیل")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        if (cat.startsWith("عکس")
            || cat.startsWith("فیلم")
            || cat.startsWith("ویدئو")
            || cat.startsWith("ویدیو")
            || cat.startsWith("صوت")
            || cat.startsWith("گزارش")
            || cat.startsWith("دیدنی")
            || cat.startsWith("موشن")
            || cat.startsWith("کاریکاتور")
            || cat.startsWith("اینفوگرافیک")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (cat.includes("ورزش") || cat.includes("المپیک") || cat.includes("جام ") || cat.includes("بازی") || cat.includes("یورو")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (cat.startsWith("فوتبال")) return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Football }
        if (cat.startsWith("کشتی")) return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Wrestling }
        if (cat.startsWith("توپ")) return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Ball }
        if (cat.startsWith("سینما")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
        if (cat.startsWith("تجسمی")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Art }
        if (cat.includes("ادبیات")) return { ...mappedCat, minor: enuMinorCategory.Multimedia, subminor: enuMinorCategory.Literature }
        if (cat.includes("فرهنگ") || cat.includes("میراث") || cat.startsWith("رسانه")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (cat.startsWith("ارتباطات")) return { ...mappedCat, minor: enuMinorCategory.Economics, subminor: enuMinorCategory.IT }
        if (cat.startsWith("دین") || cat.includes("اسلامی")) return { ...mappedCat, minor: enuMinorCategory.Religious }
        if (cat.startsWith("سلامت")) return { ...mappedCat, minor: enuMinorCategory.Health }
        if (cat.includes("آموزش")) return { ...mappedCat, minor: enuMinorCategory.Education }
        if (cat.startsWith("حقوقی")) return { ...mappedCat, minor: enuMinorCategory.Law }
        if (cat.startsWith("سیاس")
            || cat.startsWith("مجلس")
            || cat.startsWith("دولت")
            || cat.startsWith("رسانه دیگر")
            || cat.includes("خبر")
            || cat.startsWith("محور مقاومت")
            || cat.startsWith("ایسنا+")
            || cat.startsWith("شبکه")
            || cat.startsWith("سند")
            || cat.startsWith("اندیشه")
        ) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (cat.startsWith("دفاعی")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuMinorCategory.Defence }
        if (cat.startsWith("چهره")
            || cat.startsWith("دیدگاه")
            || cat.startsWith("باشگاه")
            || cat.startsWith("کانون")
            || cat.startsWith("یادداشت")) return { ...mappedCat, minor: enuMinorCategory.Generic }
        if (cat.startsWith("حوادث")) return { ...mappedCat, minor: enuMinorCategory.Generic, subminor: enuSubMinorCategory.Accident }
        if (cat.startsWith("آمریکا")
            || cat.includes("خارجی")
            || cat.startsWith("غرب")
            || cat.includes("جهان")
            || cat.includes("اقیانوسیه")
            || cat.startsWith("انرژی هسته"))
            return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }

        return { ...mappedCat, subminor: enuMinorCategory.Local }
    }
}

export class khamenei extends clsScrapper {
    constructor() {
        super(enuDomains.khamenei, "farsi.khamenei.ir", {
            selectors: {
                article: ".others-content-wrapper, #newsContentInnerSide, ._photo-post-container, .bookContent .content, .keyDtlBox",
                aboveTitle: "#Content_rutitr, .rootitr",
                title: (article: HTMLElement) => {
                    let title = article.querySelector("#Content_title")
                    if (title?.innerText) return title
                    title = article.querySelector("h3")
                    if (title?.innerText) return title
                    title = article.querySelector(".title")
                    if (title?.innerText) return title
                    return title
                },
                subtitle: "#Content_UnderTitle, .photos-lead, .lead",
                content: {
                    main: (article: HTMLElement, fullHtml: HTMLElement) =>
                        fullHtml.querySelector('._photo-post-container')
                            ? []
                            : article.querySelectorAll(".NewsText>*, .Content, .contentInbox, .keyDtlBox1, th, td, .others-content>*"),
                    alternative: "th, td",
                    ignoreNodeClasses: ["lead", "rutitr", "title", "_links", "khamenei_ir-ajs", "khamenei_ir-vjs", "inboxItems", "audioBlueBox", "yearScroller", "showTooltip"],
                },
                tags: (article: HTMLElement) =>
                    article.querySelectorAll("a").filter(a => a.getAttribute("href")?.startsWith("/tag"))
                ,
                datetime: {
                    conatiner: (article: HTMLElement) => article.classList.contains('keyDtlBox') ? article : article.querySelector("#Content_publishdate, .oliveDate, .date"),
                    splitter: (el: HTMLElement, fullHtml?: HTMLElement) => fullHtml?.querySelector('.keyDtlBox') ? "NODate" : super.extractDate(el, "-") || "NoDate",
                },
                category: {
                    selector: '#breadCrumbsContainer [itemprop="title"]',
                }
            },
            url: {
                pathToCheckIndex: 1,
                extraValidDomains: ["khamenei.ir"],
                removeWWW: true,
            }
        })
    }

    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News }
    }
}

export class citna extends clsScrapper {
    constructor() {
        super(enuDomains.citna, "citna.ir", {
            selectors: {
                article: "#content",
                title: "h1",
                summary: ".field-name-field-summary",
                content: {
                    main: ".field-name-field-image-main, .field-name-body .field-item>*",
                    ignoreNodeClasses: ["video-js", "btn"]
                },
                tags: (article: HTMLElement) => article.querySelectorAll('a').filter(el => el.getAttribute("href")?.startsWith("/tag")),
                datetime: {
                    conatiner: ".field-name-post-date",
                    splitter: "-",
                },
                category: {
                    selector: (_: HTMLElement, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".v-breadcrumbs a")
                }
            },
        })
    }

    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.ICT }
    }
}

export class itna extends clsScrapper {
    constructor() {
        super(enuDomains.itna, "itna.ir", {
            selectors: {
                article: "#docDataRow",
                title: (_: HTMLElement, fullHtml: HTMLElement) => fullHtml.querySelector("h1"),
                summary: "#docDivLead1",
                content: {
                    main: ".docContentdiv>div>div>*",
                    ignoreNodeClasses: ["video-js", "btn"]
                },
                tags: (_: HTMLElement, fullHtml: HTMLElement) => fullHtml.querySelectorAll('.doc_tags1 a'),
                datetime: {
                    conatiner: (_: HTMLElement, fullHtml: HTMLElement) => fullHtml.querySelector(".doc_date"),
                    splitter: " ",
                },
                category: {
                    selector: (_: HTMLElement, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".doc-section-info a"),
                    startIndex: 1
                },
                comments: {
                    container: (_article, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".user-comment-area"),
                    author: ".user-comment-name",
                    datetime: ".user-comment-date",
                    text: ".user-comment-content",
                }
            },
            url: {
                pathToCheckIndex: 1,
                validPathsItemsToNormalize: ["news", "multimedia"],
            }
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.ScienceTech, subminor: enuMinorCategory.IT }
        if (!cat) return mappedCat
        void cat, first, second

        if (second.startsWith("موبایل")) return { ...mappedCat, subminor: enuSubMinorCategory.Mobile }
        if (second.startsWith("روباتیك")) return { ...mappedCat, subminor: enuSubMinorCategory.Robotic }
        if (second.startsWith("بازی")) return { ...mappedCat, subminor: enuSubMinorCategory.Game }
        if (second.startsWith("سخت‌افزار") || second.startsWith("كامپیوتر همراه")) return { ...mappedCat, subminor: enuSubMinorCategory.Hardware }
        if (first.startsWith("ارتباطات") || first.includes("ICT")) return { ...mappedCat, subminor: enuMinorCategory.ICT }
        if (first.startsWith("نرم")) return { ...mappedCat, subminor: enuSubMinorCategory.Software }
        if (first.startsWith("امنیت")) return { ...mappedCat, subminor: enuSubMinorCategory.Security }

        return mappedCat
    }
}

export class zoomit extends clsScrapper {
    constructor() {
        super(enuDomains.zoomit, "zoomit.ir", {
            selectors: {
                article: "main",
                aboveTitle: "#Content_rutitr",
                title: "h1",
                summary: ".cJZnLd .BlockContainer__InnerArticleContainer-i5s1rc-1.hXzioD",
                content: {
                    main: ".eQTmR .BlockContainer__InnerArticleContainer-i5s1rc-1.hXzioD>*, img",
                },
                datetime: {
                    conatiner: ".oNOID > span:nth-child(3), .dgQNji > span:nth-child(3), .header-detail > span.eMeOeL",
                    splitter: "-",
                },
                category: {
                    selector: '.kDyGrB a',
                },
                comments: async (url: URL, reqParams: IntfRequestParams): Promise<IntfComment[]> => {
                    const comments: IntfComment[] = []
                    const match = url.pathname.match(/\/(\d+)-/);
                    let page = 1;
                    const retrieveComments = async (currentPage: number) => {
                        await axiosGet(log,
                            {
                                ...reqParams,
                                url: `https://api2.zoomit.ir/discussion/api/feedbacks?topicId=${match?.[1]}&topicType=Article&sortBy=MostLike&offset=${currentPage}&size=${20}&commentDepthLevel=5`,
                                headers: {
                                    "Content-Type": "application/json; charset=UTF-8"
                                },
                                onSuccess: async (res: any) => {
                                    res.allFeedback.forEach((item: any) => {
                                        comments.push({
                                            text: normalizeText(item.content) || "",
                                            author: normalizeText(item.user.userName),
                                            date: item.createdAt.substring(0, 10)
                                        })
                                        item.commentChildren?.forEach((child: any) => {
                                            comments.push({
                                                text: normalizeText(child.content) || "",
                                                author: normalizeText(child.user.userName),
                                                date: child.createdAt.substring(0, 10)
                                            })
                                        })
                                    })
                                    if (res.hasNext) {
                                        page++;
                                        await retrieveComments(page)
                                    }
                                },
                                onFail: (e) => { log.error(e) }
                            }
                        )
                    }

                    await retrieveComments(page)

                    return comments
                },
            },
            url: {
                extraInvalidStartPaths: ["/product"]
            }
        })
    }
    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.ScienceTech, subminor: enuMinorCategory.IT }
        if (!cat) return mappedCat
        void cat, first, second

        if (second.startsWith("موبایل")) return { ...mappedCat, subminor: enuSubMinorCategory.Mobile }
        if (second.startsWith("روباتیك")) return { ...mappedCat, subminor: enuSubMinorCategory.Robotic }
        if (second.startsWith("بازی")) return { ...mappedCat, subminor: enuSubMinorCategory.Game }
        if (second.startsWith("سخت‌افزار") || second.startsWith("كامپیوتر همراه")) return { ...mappedCat, subminor: enuSubMinorCategory.Hardware }
        if (first.startsWith("ارتباطات") || first.includes("ICT")) return { ...mappedCat, subminor: enuMinorCategory.ICT }
        if (first.startsWith("نجوم") || first.includes("ICT")) return { ...mappedCat, subminor: enuSubMinorCategory.Cosmos }
        if (first.startsWith("نرم")) return { ...mappedCat, subminor: enuSubMinorCategory.Software }
        if (first.startsWith("امنیت")) return { ...mappedCat, subminor: enuSubMinorCategory.Security }

        return mappedCat
    }
}

export class varzesh3 extends clsScrapper {
    constructor() {
        super(enuDomains.varzesh3, "varzesh3.com", {
            selectors: {
                article: ".news-content-holder article",
                aboveTitle: ".subhead",
                title: ".headline",
                subtitle: ".lead",
                content: {
                    main: ".news-detail-image, .news-text",
                    ignoreNodeClasses: ["video-js", ".news-inline-biz"]
                },
                tags: ".tagbox .tag",
                datetime: {
                    conatiner: ".news-info span:nth-child(2)",
                    splitter: "ساعت",
                },
                comments: {
                    container: ".vrz-user-comment",
                    author: ".cm-by-user",
                    datetime: (cm: HTMLElement) => dateOffsetToDate(cm.querySelector(".cm-data-t span:nth-child(2)")) || "INVALID_DATE",
                    text: ".cm-message",

                }
            },
        })
    }
    normalizePath(url: URL) {
        return super.normalizePath(url, {
            pathToCheckIndex: 1,
            validPathsItemsToNormalize: ["news"],
            extraInvalidStartPaths: ["/video"]
        })
    }

    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.Sport }
    }
}

export class tarafdari extends clsScrapper {
    constructor() {
        super(enuDomains.tarafdari, "tarafdari.com", {
            selectors: {
                article: "article.node-content",
                aboveTitle: ".field-name-field-surtitle",
                title: "h1",
                subtitle: ".field-name-field-teaser",
                content: {
                    main: ".field-name-body .field-item.even",
                    ignoreNodeClasses: ["video-js", ".news-inline-biz"]
                },
                tags: ".field-name-field-tags a",
                datetime: {
                    conatiner: '.timeago[data-tarikh]',
                    splitter: (el: HTMLElement) => {
                        console.log(el.outerHTML);
                        return super.extractDate(el.getAttribute("data-tarikh"), "-") || "DateNotfound"
                    },
                },
                comments: {
                    container: (_, fullHTML: HTMLElement) => fullHTML.querySelectorAll(".discuss"),
                    author: ".username",
                    text: ".discuss-content p",
                }
            },
            url: {
                extraInvalidStartPaths: ['/user/', '/static/'],
                ignoreContentOnPath: ["/static/page/taxonomy/"]
            }
        })
    }
    normalizePath(url: URL) {
        return super.normalizePath(url, {
            pathToCheckIndex: 1,
            validPathsItemsToNormalize: ["news"],
            extraInvalidStartPaths: ["/video"]
        })
    }

    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.Sport }
    }
}

export class pana extends clsScrapper {
    constructor() {
        super(enuDomains.pana, "pana.ir", {
            selectors: {
                article: "article[itemscope], #PhotoGalleryContainer",
                aboveTitle: "#Content_rutitr",
                title: "#Content_title",
                subtitle: "#Content_UnderTitle, #Content_lid",
                content: {
                    main: ".NewsText>*, .photoThumbnail",
                    ignoreNodeClasses: ["video-js", "btn"]
                },
                tags: "#keyWordContainer strong",
                datetime: {
                    conatiner: "#Content_publishdate",
                    splitter: "-",
                },
                category: {
                    selector: '#breadCrumbsContainer [itemprop="title"]',
                }
            },
            url: {
                extraInvalidStartPaths: ["/newspdf"],
                pathToCheckIndex: 1,
            }
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (first.includes("آموزش")) return { ...mappedCat, minor: enuMinorCategory.Education }
        if (cat.includes("ادبیات")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Literature }
        if (cat.includes("فرهنگی")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (cat.startsWith("عکس") || cat.startsWith("ویدئو")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (cat.includes("سیاسی")) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (cat.includes("بهداشت")) return { ...mappedCat, minor: enuMinorCategory.Social, subminor: enuMinorCategory.Health }
        if (cat.includes("اجتماعی")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (cat.includes("علمی")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
        if (cat.includes("پزشکی")) return { ...mappedCat, minor: enuMinorCategory.Health }
        if (cat.includes("اقتصاد") || second.startsWith("بازار")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (cat.includes("ورزشی")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (cat.includes("استان")) return { ...mappedCat, minor: enuMinorCategory.Local }

        return mappedCat
    }
}

export class niknews extends clsScrapper {
    constructor() {
        super(enuDomains.niknews, "niknews.ir", {
            selectors: {
                article: "article",
                datetime: {
                    conatiner: "div[class='col-12 col-sm-6 justify-content-end p-0 d-flex'], div[class='col-12 col-sm-6 p-0 d-flex']"
                },
                content: {
                    main: ".item-body"
                },
                title: ".line-height-2",
                category: {
                    selector: (article: HTMLElement) => article.querySelector(".breadcrumb")?.querySelectorAll("li a"),
                }
            }
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (second.startsWith("اق") || second.startsWith("اتص")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (second.startsWith("سی")) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (second.endsWith("عی")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (second.endsWith("ور")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        return mappedCat
    }
}

export class namnak extends clsScrapper {
    constructor() {
        super(enuDomains.namnak, "namnak.com", {
            selectors: {
                article: "#cta",
                title: "h1",
                summary: ".E9",
                content: {
                    main: "#pc",
                },
                datetime: {
                    conatiner: ".a.s.f",
                    splitter: (el: HTMLElement) => super.extractDate(el, "-") || "DATE NOT FOUND",
                    acceptNoDate: true
                },
                category: {
                    selector: '#cpath a',
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".C8.b.i"),
                    author: "b[itemprop='name']",
                    datetime: "span[itemprop='commentTime']",
                    text: ".Ca .Cm .cmtx"
                }
            },
            url: {
                removeWWW: true,
                extraInvalidStartPaths: ["/ag_1_1.do"]
            }
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (second.startsWith("تاریخ")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Historical }
        if (second.startsWith("موسیقی")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Music }
        if (second.startsWith("هنر")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Art }
        if (second.startsWith("ادبیات")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Literature }
        if (cat.includes("فرهنگ") || cat.includes("گردشگری")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (cat.includes("ورزش")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (cat.includes("حوادث")) return { ...mappedCat, minor: enuMinorCategory.Generic, subminor: enuSubMinorCategory.Accident }
        if (cat.includes("دانشگاه")) return { ...mappedCat, minor: enuMinorCategory.University }
        if (cat.includes("موبایل")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Mobile }
        if (cat.includes("سخت افزار")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Hardware }
        if (first.startsWith("فناوری") || cat.includes("علمی")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
        if (cat.includes("جامعه") || first.startsWith("خانواده")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (cat.includes("اقتصاد") || cat.includes("استخدام")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (cat.includes("سلامت") || cat.includes("بارداری")) return { ...mappedCat, minor: enuMinorCategory.Health }
        if (cat.startsWith("آشپز")) return { ...mappedCat, minor: enuMinorCategory.Cooking }
        if (cat.includes("تناسب") || cat.includes("دنیای مد")) return { ...mappedCat, minor: enuMinorCategory.LifeStyle }
        if (cat.includes("سرگرمی")) return { ...mappedCat, minor: enuMinorCategory.Fun }
        if (cat.includes("دین")) return { ...mappedCat, minor: enuMinorCategory.Religious }
        if (cat.includes("سیاست")) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (second.startsWith("خبر")) return { ...mappedCat, minor: enuMinorCategory.Generic }

        return mappedCat
    }
}

export class beytoote extends clsScrapper {
    constructor() {
        super(enuDomains.beytoote, "beytoote.com", {
            selectors: {
                article: "article",
                title: "h1",
                content: {
                    main: "p, h2, .imgarticle",
                },
                datetime: {
                    conatiner: "dd.published",
                    splitter: (el: HTMLElement) => super.extractDate(el, "-") || "DATE NOT FOUND",
                    acceptNoDate: true
                },
                category: {
                    selector: 'dd.category-name a',
                },
            },
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.LifeStyle }
        if (!cat) return mappedCat
        void cat, first, second

        if (cat.includes("روانشناسی")) return { ...mappedCat, minor: enuMinorCategory.Psychology }
        if (cat.includes("پزشکی")
            || cat.includes("ایدز")
            || cat.includes("دارویی")
            || cat.includes("داروهای")
            || cat.includes("بارداری")
            || cat.includes("سالم")
            || cat.includes("بهداشت")
            || cat.includes("بیماری")
            || cat.includes("درمان")
            || cat.includes("بیماری")
            || cat.includes("سالم")
            || cat.includes("تغذیه")
            || cat.includes("جنسی")
            || cat.includes("نوزادان")
            || cat.includes("سلامت")
            || cat.includes("رژیمی")
            || cat.includes("کالری")
            || cat.includes("تغذیه")
        ) return { ...mappedCat, minor: enuMinorCategory.Health }
        if (cat.includes("علمی و آموزشی")) return { ...mappedCat, minor: enuMinorCategory.Education }
        if (cat.includes("هنر")
            || cat.includes("گرافیک")
        ) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Art }
        if (cat.includes("غذاها")
            || cat.includes("شیرینی")
            || cat.includes("ترشیجات")
            || cat.includes("آشپزی")
        ) return { ...mappedCat, minor: enuMinorCategory.Cooking }
        if (cat.startsWith("ابزار")
            || cat.includes("تکنولوژی")
            || cat.includes("اختراعات")
            || cat.includes("علمی")
            || cat.includes("گیاهان")
            || cat.includes("کشفیات")
        ) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
        if (cat.startsWith("احادیث")
            || cat.startsWith("احکام")
            || cat.endsWith(" دین")
            || cat.endsWith(" دینی")
            || cat.endsWith("داروخانه")
            || cat.endsWith("مستحبی")
        ) return { ...mappedCat, minor: enuMinorCategory.Religious }
        if (cat.includes("تحصیلی")) return { ...mappedCat, minor: enuMinorCategory.University }
        if (cat.includes("روزنامه")) return { ...mappedCat, major: enuMajorCategory.News }
        if (cat.includes("اجتماعی") || cat.startsWith("خانواده")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (cat.includes("اقتصاد")
            || cat.includes("مشاغل")
            || cat.includes("بازار")
            || cat.includes("شارژ")
            || cat.includes("بازار")
            || cat.includes("گلیم")
        ) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (cat.includes("الملل") || cat.includes("خارجی")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        if (cat.includes("سیاسی") || cat.includes("خارجی")) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (cat.includes("حوادث")) return { ...mappedCat, minor: enuMinorCategory.Generic, subminor: enuSubMinorCategory.Accident }
        if (cat.includes("فرهنگ") || cat.includes("گردشگری")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (cat.includes("گوناگون") || cat.includes("انعکاس")) return { ...mappedCat, minor: enuMinorCategory.Generic }
        if (cat.includes("ستاره")) return { ...mappedCat, subminor: enuSubMinorCategory.Celebrities }
        if (cat.includes("ورزش")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (cat.includes("ستاره")
            || cat.includes("بازیگران")) return { ...mappedCat, minor: enuMinorCategory.LifeStyle, subminor: enuSubMinorCategory.Celebrities }
        if (cat.includes("سرگرمی")
            || cat.includes("جالب")
            || cat.includes("طنز")
            || cat.includes("معما")
            || cat.includes("فال ")
        ) return { ...mappedCat, minor: enuMinorCategory.Fun }
        if (cat.endsWith("خودرو")) return { ...mappedCat, minor: enuMinorCategory.Education, subminor: enuSubMinorCategory.Car }
        if (cat.includes("تصاویر")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (cat.includes("تاریخ")) return { ...mappedCat, minor: enuMinorCategory.Historical }
        if (cat.includes("اینترنت") || cat.includes("کامپیوتر")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuMinorCategory.IT }
        if (cat.includes("مسافرتی")
            || cat.endsWith("سفر")
            || cat.includes("گردشگری")
            || cat.startsWith("مكانهای")
            || cat.startsWith("مناسبتها")
        ) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Tourism }
        if (cat.includes("داستانهای")
            || cat.endsWith("المثل")
            || cat.includes("شعر")
            || cat.includes("حکایت")
        ) return { ...mappedCat, minor: enuMinorCategory.Literature }
        if (cat.startsWith("آیا")
            || cat.startsWith("چرا")
            || cat.startsWith("متفرقه")
        ) return { ...mappedCat, minor: enuMinorCategory.Generic }
        if (cat.includes("موبایل")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Mobile }
        if (cat.startsWith("حقوقی")) return { ...mappedCat, minor: enuMinorCategory.Law }
        return mappedCat
    }
}

export class arzdigital extends clsScrapper {
    constructor() {
        super(enuDomains.arzdigital, "arzdigital.com", {
            selectors: {
                article: (doc: HTMLElement, _: HTMLElement, url: URL) =>
                    url.pathname.startsWith("/ideas")
                        ? doc.querySelector("section.arz-container")
                        : doc.querySelector("#post-page .arz-post, section.arz-post__content, #academy-pages, article, .arz-coin-details__explanation")
                ,
                title: "h1, h2",
                datetime: {
                    conatiner: "time",
                    splitter: (el: HTMLElement) => {
                        const date = el.getAttribute("datetime")?.match(/\d{4}-\d{2}-\d{2}/);
                        if (!el.textContent.includes("آخرین") && date) {
                            return date[0];
                        }
                        else
                            return super.extractDate(el, "-") || "DATE NOT FOUND"
                    },
                    acceptNoDate: true
                },
                content: {
                    main: "section.arz-post__content, .arz-breaking-news-post__content, .ideas-update-content, #panzoom-element, arz-coin-details__explanation-text, #academy-page-content, .arz-breaking-news-post__source",
                    alternative: ".arz-coin-details__explanation-text"
                },
                tags: "ul.arz-post-tags__list li a",
                category: {
                    selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ul.arz-path-list li a")
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".wpd-thread-list .wpd-comment"),
                    author: ".wpd-comment-wrap .wpd-comment-right .wpd-comment-author",
                    text: " .wpd-comment-wrap .wpd-comment-right .wpd-comment-text"
                }
            }
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat = { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.CryptoCurrency }
        if (!cat) return mappedCat
        void cat, first, second

        if (second.startsWith("بیاموزید") || second.startsWith("دانشنامه")) return { ...mappedCat, subminor: enuMinorCategory.Education }
        if (second.startsWith("مصاحبه")) return { ...mappedCat, subminor: enuMinorCategory.Talk }
        return mappedCat
    }
}

export class ramzarz extends clsScrapper {
    constructor() {
        super(enuDomains.ramzarz, "ramzarz.news", {
            selectors: {
                article: "article.single-post-content, article.single-page-content, article.question-share-2",
                title: "h1",
                content: {
                    main: ".entry-content p, img, #myTable",
                },
                datetime: {
                    conatiner: "time b",
                    splitter: (el: HTMLElement) => super.extractDate(el, "-") || "DATE NOT FOUND",
                    acceptNoDate: true
                },
                category: {
                    selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ul.bf-breadcrumb-items li a, p.breadcrumb-st a, span.breadcrumb-item span a"),
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".wpd-thread-list .wpd-comment"),
                    author: ".wpd-comment-wrap .wpd-comment-right .wpd-comment-author",
                    datetime: ".wpd-comment-wrap .wpd-comment-right .wpd-comment-date",
                    text: " .wpd-comment-wrap .wpd-comment-right .wpd-comment-text"
                }
            },
            url: {
                removeWWW: true,
            }
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.CryptoCurrency }
        if (!cat) return mappedCat
        void cat, first, second

        if (second.startsWith("ویدئو")) return { ...mappedCat, minor: enuMinorCategory.Multimedia, subminor: enuMinorCategory.CryptoCurrency }
        if (second.startsWith("رپورتاژ")) return { ...mappedCat, subminor: enuSubMinorCategory.Reportage }
        return mappedCat
    }
}

export class digiato extends clsScrapper {
    constructor() {
        super(enuDomains.digiato, "digiato.com", {
            selectors: {
                article: "#articleNewsPosts, .sitePage__content",
                title: (_, fullHTML: HTMLElement) => fullHTML.querySelector(".dailyNewsPageHead__description--title, h1.singleVideoPageTitle"),
                summary: (_, fullHTML: HTMLElement) => fullHTML.querySelector(".dailyNewsPageHead__description p"),
                datetime: {
                    conatiner: (_, fullHTML: HTMLElement) => fullHTML.querySelector(".dailyNewsPageHead__description--tools"),
                    splitter: (el: HTMLElement) => super.extractDate(el, el.classList.contains("comment-date") ? " " : "|") || "DATE NOT FOUND",
                },
                content: {
                    main: '.articlePost, .singleVideoPost',
                },
                tags: ".postTools__keywords a",
                category: {
                    selector: (_, fullHTML: HTMLElement) => fullHTML.querySelectorAll(".breadcrumb ul li:nth-child(2) a, .breadcrumb ul li:nth-child(3) a")
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ul.js-comments-list li"),
                    author: ".comment__info span",
                    text: ".comment__text"
                }
            },
            url: {
                removeWWW: true,
                extraInvalidStartPaths: ["/author", "/topic", "/?s="]
            }
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (cat.includes("ویدیو") || cat.includes("تماشا")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (cat.includes("کار") || cat.includes("بازار")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (cat.includes("امنیت")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Security }
        if (cat.includes("موبایل")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Mobile }
        if (cat.includes("اپلیکیشن")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Software }
        if (cat.includes("سخت")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Hardware }
        if (cat.includes("بازی")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Game }
        if (cat.includes("خودرو")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Car }
        if (cat.includes("تلویزیون")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.TV }
        if (cat.includes("گجت")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Gadgets }
        if (cat.includes("آموزش")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuMinorCategory.Education }
        if (cat.includes("کریپتو")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuMinorCategory.CryptoCurrency }
        if (cat.includes("سلامت")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuMinorCategory.Health }
        if (cat.includes("هوش")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.AI }
        if (cat.includes("آگهی")) return { ...mappedCat, minor: enuMinorCategory.Advert }


        return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
    }
}

export class khatebazar extends clsScrapper {
    constructor() {
        super(enuDomains.khatebazar, "khatebazar.ir", {
            selectors: {
                article: ".single",
                title: "h1 a",
                datetime: {
                    conatiner: "span.the_time"
                },
                content: {
                    main: ".contentsingle p"
                },
                category: {
                    selector: ".the_category a"
                }
            }
        })
    }
    protected mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.Economics }
    }
}

export class jomhouriat extends clsScrapper {
    constructor() {
        super(enuDomains.jomhouriat, "jomhouriat.ir", {
            selectors: {
                article: ".content",
                title: "h1 a",
                subtitle: ".lead",
                datetime: {
                    conatiner: "ul.news-detile li:nth-child(2) span"
                },
                content: {
                    main: ".entry p, .thumbnail a",
                    ignoreTexts: ["بیشتر بخوانید"]
                },
                category: {
                    selector: ".crumbs a"
                },
                tags: ".post-tag a"
            }
        })
    }
    protected normalizeCategoryImpl(cat?: string | undefined): string | undefined {
        return cat?.replace(/^خانه\//, "").trim()
    }
    protected mapCategoryImpl(category: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        void category, first, second
        if (first.includes("اقتصاد")
            || first.includes("بانک")
            || first.includes("بیمه")
            || first.includes("بورس")
            || first.includes("تجارت")
            || first.includes("تولید")
            || first.includes("بانک")
            || first.includes("صنعت")
            || first.includes("مسکن و راه")
        ) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (first.includes("شرعی")) return { ...mappedCat, minor: enuMinorCategory.Religious }
        if (first.includes("انتخابات")
            || first.includes("دولت")
            || first.includes("سیاست")
        ) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (first.includes("بیوگرافی")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Celebrities }
        if (first.includes("پتروشیمی")) return { ...mappedCat, minor: enuMinorCategory.Economics, subminor: enuSubMinorCategory.Petroleum }
        if (first.includes("پوشاک")) return { ...mappedCat, minor: enuMinorCategory.LifeStyle }
        if (first.includes("تعبیر خواب")
            || first.includes("فال ")
        ) return { ...mappedCat, minor: enuMinorCategory.Fun }
        if (first.includes("توپ و تور")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (first.includes("جامعه")
            || first.includes("زناشویی")
        ) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (first.includes("حقوقی")) return { ...mappedCat, minor: enuMinorCategory.Law }
        if (first.includes("حوادث")) return { ...mappedCat, minor: enuMinorCategory.Social, subminor: enuSubMinorCategory.Accident }
        if (first.includes("خودرو")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Car }
        if (first.includes("رسانه")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (first.includes("سلامت")) return { ...mappedCat, minor: enuMinorCategory.Health }
        if (first.includes("سینما")
            || first.includes("فیلم")
        ) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
        if (first.includes("صنایع دستی")
            || first.includes("فرهنگ")
        ) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (first.includes("عکس")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Photo }
        if (first.includes("فن آوری")
            || first.includes("فناوری")
        ) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
        if (first.includes("فوتبال")) return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Football }
        if (first.includes("گردشگری")) return { ...mappedCat, minor: enuMinorCategory.Tourism }
        if (first.includes("ورزش")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (first.includes("شرعی")) return { ...mappedCat, minor: enuMinorCategory.Religious }
        if (first.includes("شرعی")) return { ...mappedCat, minor: enuMinorCategory.Religious }
        return mappedCat
    }
}

export class ofoghnews extends clsScrapper {
    constructor() {
        super(enuDomains.ofoghnews, "ofoghnews.ir", {
            selectors: {
                article: ".content, .gallery-content",
                title: "h1 a",
                subtitle: ".lead",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: ".entry, .gallery a",
                },
                tags: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".post-tag a")
            }
        })
    }

    protected mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News }
    }
}

export class iwna extends clsScrapper {
    constructor() {
        super(enuDomains.iwna, "iwna.ir", {
            selectors: {
                article: "section.single, .gallery-p",
                title: "h1, .title h2 a",
                subtitle: ".lead",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                    acceptNoDate: true
                },
                content: {
                    main: ".post-content .con, .lightgallery",
                },
                tags: "[rel='tag']"
            }
        })
    }
    protected mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News }
    }
}

export class vido extends clsScrapper {
    constructor() {
        super(enuDomains.vido, "vido.ir", {
            selectors: {
                article: "#the-post",
                title: "h1",
                datetime: {
                    conatiner: "span.date"
                },
                content: {
                    main: ".entry-content",
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li article"),
                    author: "footer .comment-author b",
                    datetime: "time",
                    text: ".comment-content"
                },
                category: {
                    selector: "a.post-cat"
                }
            },
            url: {
                removeWWW: true,
                extraInvalidStartPaths: ["/www.", "/instagram", "/uupload", "/beeptunes", "/upera", "/vakil", "/elitland",
                    "/amoozeshgahan", "/saziha"]
            }
        })
    }
    protected mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
    }
}

export class filmmagazine extends clsScrapper {
    constructor() {
        super(enuDomains.filmmagazine, "film-magazine.com", {
            selectors: {
                article: ".content",
                title: (_, fullHtml: HTMLElement) => fullHtml.querySelector("h1"),
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("h4 span")
                },
                content: {
                    main: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".content"),
                    ignoreTexts: ["[ماهنامه فیلم]"]
                },
            },
        })
    }
    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
    }
}

export class asrkhabar extends clsScrapper {
    constructor() {
        super(enuDomains.asrkhabar, "asrkhabar.com", {
            selectors: {
                article: "#the-post",
                title: "h1",
                datetime: {
                    conatiner: "span.date"
                },
                content: {
                    main: ".entry-content",
                    ignoreNodeClasses: ["post-bottom-meta", "post-shortlink"]
                },
                category: {
                    selector: "#breadcrumb a",
                    startIndex: 0,
                    lastIndex: 2
                },
                tags: "[rel='tag']"
            }
        })
    }
    protected normalizeCategoryImpl(cat?: string | undefined): string | undefined {
        return cat?.replace(/^خانه\//, "").trim()
    }
    protected mapCategoryImpl(category: string | undefined): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (category?.includes("اجتماعی")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (category?.includes("اقتصاد")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (category?.includes("بازار")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (category?.includes("خارجی")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        if (category?.includes("سرگرمی")) return { ...mappedCat, minor: enuMinorCategory.Fun }
        if (category?.includes("سلامت")) return { ...mappedCat, minor: enuMinorCategory.Health }
        if (category?.includes("سیاست")) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (category?.includes("عکس و فیلم")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (category?.includes("علم، فنآوری و IT")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
        if (category?.includes("فرهنگ و هنر")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (category?.includes("فیلم و سینما و تلویزیون")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (category?.includes("ورزش")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        return mappedCat
    }
}

export class zoomg extends clsScrapper {
    constructor() {
        super(enuDomains.zoomg, "zoomg.ir", {
            selectors: {
                article: ".article-content",
                title: "h1 span span",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: "#bodyContainer, img.cover",
                },
                category: {
                    selector: ".topicCategories a",
                },
            }
        })
    }
    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.Fun, subminor: enuSubMinorCategory.Game }
    }
}

export class pedal extends clsScrapper {
    constructor() {
        super(enuDomains.pedal, "pedal.ir", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                    acceptNoDate: true
                },
                content: {
                    main: ".entry-content",
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li .single-comment"),
                    author: ".comment_header p cite",
                    text: ".comment-content .comment"
                },
                category: {
                    selector: "span.post-cat-wrap a",
                },
            }
        })
    }
    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Car }
    }
}

export class car extends clsScrapper {
    constructor() {
        super(enuDomains.car, "car.ir", {
            selectors: {
                article: ".box__details",
                title: "h1",
                datetime: {
                    conatiner: "span.dates"
                },
                content: {
                    main: ".text__ordered",
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".comment-items ul li"),
                    author: ".avatar span:nth-child(2)",
                    text: "p.text__ordered"
                },
                category: {
                    selector: ".pull-right .category a",
                },
            },
            url: {
                extraInvalidStartPaths: ["/prices"]
            }
        })
    }

    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.ScienceTech, subminor: enuSubMinorCategory.Car }
    }
}

export class sofiamag extends clsScrapper {
    constructor() {
        super(enuDomains.sofiamag, "sofiamag.ir", {
            selectors: {
                article: ".rounded.py-3 > section",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='og:article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: "#rt-post-body-content",
                    ignoreNodeClasses: ["r-row"]
                },
                tags: ".border-bottom a"
            }
        })
    }
}

export class gamefa extends clsScrapper {
    constructor() {
        super(enuDomains.gamefa, "gamefa.com", {
            selectors: {
                article: ".single-article ",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: ".content, .thumbnail img",
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ul.pr-0 li.comment .comment-body"),
                    author: ".comment-author cite a",
                    text: "p"
                },
                category: {
                    selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".aioseo-breadcrumbs span a"),
                    startIndex: 1
                },
                tags: "[rel='tag']"
            }
        })
    }

    mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.Fun, subminor: enuSubMinorCategory.Game }
    }
}

export class ictnn extends clsScrapper {
    constructor() {
        super(enuDomains.ictnn, "ictnn.ir", {
            selectors: {
                article: "body.single-post",
                title: "h1.jeg_post_title",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: ".content-inner",
                    ignoreTexts: [/.*مجله خبری.*/]
                },
                category: {
                    selector: "span.breadcrumb_last_link a",
                },
            },
            url: {
                removeWWW: true
            }
        })
    }
    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.ICT }
        if (!cat) return mappedCat
        void cat, first, second

        if (cat.includes("نرم افزار")) return { ...mappedCat, subminor: enuSubMinorCategory.Software }
        if (cat.includes("Gaming")) return { ...mappedCat, subminor: enuSubMinorCategory.Game }
        if (cat.includes("Security")) return { ...mappedCat, subminor: enuSubMinorCategory.Security }
        if (cat.includes("اقتصاد")) return { ...mappedCat, subminor: enuMinorCategory.Economics }
        if (cat.includes("Smartphone")) return { ...mappedCat, subminor: enuSubMinorCategory.Mobile }
        if (cat.includes("Computers")) return { ...mappedCat, subminor: enuSubMinorCategory.Hardware }
        if (cat.includes("Photography")) return { ...mappedCat, subminor: enuSubMinorCategory.Photo }

        return mappedCat
    }
}

export class aryanews extends clsScrapper {
    constructor() {
        super(enuDomains.aryanews, "aryanews.com", {
            selectors: {
                article: ".col-md-8 #content-news",
                title: "h1.title-news",
                datetime: {
                    conatiner: "span.date-created"
                },
                content: {
                    main: ".main-news",
                },
                category: {
                    selector: ".section-name a",
                },
            },
        })
    }

    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (first.includes("اجتماعی")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (first.includes("استان")) return { ...mappedCat, minor: enuMinorCategory.Local }
        if (first.includes("اقتصاد") || second.startsWith("بازار")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (first.includes("الملل")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        if (first.includes("سیاسی")) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (first.includes("علمی")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
        if (first.includes("فرهنگی")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (first.includes("هنری")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Art }
        if (first.includes("ورزشی")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (first.includes("آموزش")) return { ...mappedCat, minor: enuMinorCategory.Education }
        if (first.includes("ادبیات")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Literature }
        if (first.startsWith("عکس") || cat.startsWith("ویدئو")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (first.includes("بهداشت")) return { ...mappedCat, minor: enuMinorCategory.Social, subminor: enuMinorCategory.Health }
        if (first.includes("پزشکی")) return { ...mappedCat, minor: enuMinorCategory.Health }

        return mappedCat
    }
}

export class sinapress extends clsScrapper {
    constructor() {
        super(enuDomains.sinapress, "sinapress.ir", {
            selectors: {
                article: "#the-post",
                title: "h1",
                datetime: {
                    conatiner: "span.date"
                },
                content: {
                    main: ".entry-content",
                    ignoreNodeClasses: ["st-post-tags"]
                },
                tags: ".st-post-tags a"
            },
            url: {
                removeWWW: true
            }
        })
    }
    protected mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News }
    }
}

export class shomalnews extends clsScrapper {
    constructor() {
        super(enuDomains.shomalnews, "shomalnews.com", {
            selectors: {
                article: ".content.news",
                aboveTitle: ".rutitr",
                title: ".title",
                summary: ".summary",
                datetime: {
                    conatiner: ".date .left"
                },
                content: {
                    main: ".news_body",
                },
            },
        })
    }
    protected mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News }
    }
}

export class artanpress extends clsScrapper {
    constructor() {
        super(enuDomains.artanpress, "artanpress.ir", {
            selectors: {
                article: ".ap_newssingle .ap-single",
                aboveTitle: ".catpo",
                title: "h1",
                subtitle: ".excerpt",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: "#entry .entry",
                    ignoreNodeClasses: ["tag"]
                },
                category: {
                    selector: "[rel='category tag']",
                },
            },
        })
    }
    protected normalizeCategoryImpl(cat?: string | undefined): string | undefined {
        if (!cat) return cat
        const parts = cat.split("/")
        return parts.at(0) + (parts.length > 1 ? ("/" + parts.at(1)) : "")
    }
    protected mapCategoryImpl(): IntfMappedCategory {
        return { textType: enuTextType.Formal, major: enuMajorCategory.News, minor: enuMinorCategory.Economics }
    }
}

export class manbaekhabar extends clsScrapper {
    constructor() {
        super(enuDomains.manbaekhabar, "manbaekhabar.ir", {
            selectors: {
                article: "article.is-single",
                aboveTitle: ".lid_news ",
                title: "h1",
                summary: ".desc_news",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: ".news_content",
                    ignoreNodeClasses: ["post_source"]
                },
                category: {
                    selector: ".breadcrumb a",
                    startIndex: 1,
                    lastIndex: 3
                },
                tags: ".tag_wrap a"
            },
        })
    }
    mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
        const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
        if (!cat) return mappedCat
        void cat, first, second

        if (first.includes("اجتماعی")) return { ...mappedCat, minor: enuMinorCategory.Social }
        if (first.includes("استان")) return { ...mappedCat, minor: enuMinorCategory.Local }
        if (first.includes("اقتصاد") || second.startsWith("بازار")) return { ...mappedCat, minor: enuMinorCategory.Economics }
        if (first.includes("الملل")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
        if (first.includes("سیاسی")) return { ...mappedCat, minor: enuMinorCategory.Political }
        if (first.includes("علمی")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
        if (first.includes("فرهنگی")) return { ...mappedCat, minor: enuMinorCategory.Culture }
        if (first.includes("هنری")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Art }
        if (first.includes("ورزشی")) return { ...mappedCat, minor: enuMinorCategory.Sport }
        if (first.includes("آموزش")) return { ...mappedCat, minor: enuMinorCategory.Education }
        if (first.includes("ادبیات")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Literature }
        if (first.startsWith("عکس") || cat.startsWith("ویدئو")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
        if (first.includes("بهداشت")) return { ...mappedCat, minor: enuMinorCategory.Social, subminor: enuMinorCategory.Health }
        if (first.includes("فوتبال")) return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Football }
        if (first.includes("کشتی")) return { ...mappedCat, minor: enuMinorCategory.Sport, subminor: enuSubMinorCategory.Wrestling }

        return mappedCat
    }
}

export class vigiato extends clsScrapper {
    constructor() {
        super(enuDomains.vigiato, "vigiato.net", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: ".content",
                    ignoreTexts: [/.*<img.*/]
                },               
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".wpd-thread-list .comment"),
                    author: ".wpd-comment-author",
                    text: ".wpd-comment-text"
                },
                category: {
                    selector: "#breadcrumb > span > span > a",
                },
                tags: ".tags a"
            },
            url: {
                removeWWW: true
            }
        })
    }
}

export class techrato extends clsScrapper {
    constructor() {
        super(enuDomains.techrato, "techrato.com", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: "[itemprop='articleBody'] p, [itemprop='articleBody'] h2, [itemprop='articleBody'] table",
                    ignoreTexts: [/.*بیشتر بخوانید.*/]
                },               
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("section.comments-list article"),
                    author: ".comment-meta div",
                    text: ".comment-content"
                },
                category: {
                    selector: ".post-categories li a",
                },
                tags: ".tags-nav a"
            },
            url: {
                removeWWW: true
            }
        })
    }
}

export class gadgetnews extends clsScrapper {
    constructor() {
        super(enuDomains.gadgetnews, "gadgetnews.net", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: ".entry",
                    ignoreNodeClasses: ["box-inner-block"]
                },               
                tags: ".post-tag a"
            },
            url: {
                removeWWW: true
            }
        })
    }
}

export class akhbarelmi extends clsScrapper {
    constructor() {
        super(enuDomains.akhbarelmi, "akhbarelmi.ir", {
            selectors: {
                article: ".single",
                title: "h1",
                datetime: {
                    conatiner: ".meta div:nth-child(2) a.link "
                },
                content: {
                    main: "aside.fa_news",
                },
                category: {
                    selector: ".meta div:nth-child(1) a.link ",
                },               
                tags: ".post-tag a"
            },
            url: {
                removeWWW: true
            }
        })
    }
}

export class ettelaat extends clsScrapper {
    constructor() {
        super(enuDomains.ettelaat, "ettelaat.com", {
            selectors: {
                article: "#news",
                title: "h1",
                subtitle: ".leadRow",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: ".newsBody",
                },
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("#comments .commentBox .cmItem"),
                    author: ".cmName",
                    text: ".cmMsg"
                },
                category: {
                    selector: "a.newsBreadCrumb ",
                },               
            },
        })
    }
}

export class technoc extends clsScrapper {
    constructor() {
        super(enuDomains.technoc, "technoc.ir", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: ".entry-content",
                    ignoreNodeClasses: ["yarpp"],
                    ignoreTexts: [/.*<img.*/]
                },               
                tags: ".post-tag a",
                category: {
                    selector: "h6.entry-category a",
                },               
            },
            url: {
                removeWWW: true
            }
        })
    }
}

export class zoomtech extends clsScrapper {
    constructor() {
        super(enuDomains.zoomtech, "zoomtech.org", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time'], time"),
                    splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: ".entry-content",
                    ignoreNodeClasses: ["ctaText"],
                    ignoreTexts: [/.*padding.*/]
                },               
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li article"),
                    author: "footer .comment-author b",
                    datetime: "time",
                    text: ".comment-content"
                },
                tags: ".article_tags a",
                category: {
                    selector: ".article_category a",
                },               
            },
            url: {
                removeWWW: true
            }
        })
    }
}

export class shahrsakhtafzar extends clsScrapper {
    constructor() {
        super(enuDomains.shahrsakhtafzar, "shahrsakhtafzar.com", {
            selectors: {
                article: "body.view-article",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
                    splitter: (el: HTMLElement) => el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: "[itemprop='articleBody']",
                    ignoreNodeClasses: ["typo6"]
                },    
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".kmt-list li"),
                    author: ".kmt-author span",
                    datetime: "time",
                    text: ".commentText"
                },           
                category: {
                    selector: ".sazitem_imgcat a",
                },               
            },
        })
    }
}

export class click extends clsScrapper {
    constructor() {
        super(enuDomains.click, "click.ir", {
            selectors: {
                article: "body.news",
                title: "h1",
                subtitle: ".lead",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector(".show_desk time"),
                    splitter: (el: HTMLElement) => el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE",
                },
                content: {
                    main: ".echo_detail",
                },      
                tags: ".article_tag a",
                category: {
                    selector: ".show_desk [itemprop='name']",
                },               
            },
        })
    }
}

export class gooyait extends clsScrapper {
    constructor() {
        super(enuDomains.gooyait, "gooyait.com", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time'], time"),
                    splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: ".single-main-content",
                    ignoreNodeClasses: ["lwptoc"],
                },               
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li article"),
                    author: "footer .comment-author b",
                    datetime: "time",
                    text: ".comment-content"
                },
                tags: ".article_tags a",
                category: {
                    selector: "#breadcrumbs span span a",
                    lastIndex: 2
                },               
            },

        })
    }
}

export class digiro extends clsScrapper {
    constructor() {
        super(enuDomains.digiro, "digiro.ir", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
                    splitter: (el: HTMLElement) => el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: ".entry-content ",
                    ignoreTexts: [/.*بیشتر بخوانید.*/]
                },               
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".wpd-thread-list .comment"),
                    author: ".wpd-comment-author",
                    text: ".wpd-comment-text"
                },
                tags: "[rel='tag']",
                category: {
                    selector: ".post-meta-wrap .term-badges  span a",
                },               
            },
        })
    }
}

export class alodoctor extends clsScrapper {
    constructor() {
        super(enuDomains.alodoctor, "alodoctor.com", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
                    splitter: (el: HTMLElement) => el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
                },
                summary: ".single-post-excerpt",
                content: {
                    main: ".single-post-content-root",
                    ignoreNodeClasses: ["single-post-tags-root"],
                },               
                comments: {
                    container: ".comments-list .comment-item",
                    author: "p.comment-author",
                    text: ".pt-2.pl-0"
                },
                tags: ".single-post-tags-root div a",
                category: {
                    selector: "ol.breadcrumb li a",
                    lastIndex: 2
                },               
            },
        })
    }
}

export class charkhan extends clsScrapper {
    constructor() {
        super(enuDomains.charkhan, "charkhan.com", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
                    splitter: (el: HTMLElement) => el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
                },
                summary: ".single-post-excerpt",
                content: {
                    main: "article > .entry-content",
                    ignoreNodeClasses: ["drupysib"],
                },               
                comments: {
                    container: "ol.comment-list li",
                    author: "cite.comment-author",
                    datetime: "time",
                    text: ".comment-content"
                },
                category: {
                    selector: ".post-header-title .term-badges span a",
                },               
            },
        })
    }
}

export class ensafnews extends clsScrapper {
    constructor() {
        super(enuDomains.ensafnews, "ensafnews.com", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                subtitle: ".entry-sub-title",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: "article > .entry-content",
                    ignoreNodeClasses: ["tagcloud"],
                },               
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li article"),
                    author: "footer .comment-author b",
                    datetime: "time",
                    text: ".comment-content"
                },
                tags: ".tagcloud a"           
            },
        })
    }
}

export class akharinkhabar extends clsScrapper {
    constructor() {
        super(enuDomains.akharinkhabar, "akharinkhabar.ir", {
            selectors: {
                article: "#view-module",
                title: "h1",
                subtitle: ".entry-sub-title",
                datetime: {
                    conatiner: ".asset-metabar-time.asset-metabar-item",
                },
                content: {
                    main: ".asset-double-wide",
                    ignoreNodeClasses: ["main-share-box", "copy-link", "font-size--main-box"],
                    ignoreTexts: [/.*«آخرین خبر».*/, /.*instagram.*/]
                },               
                category: {
                    selector: ".asset-metabar-cat"
                },
                tags: ".tags-box a strong"           
            },
        })
    }
}

export class pgnews extends clsScrapper {
    constructor() {
        super(enuDomains.pgnews, "pgnews.ir", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: ".entry-content",
                    ignoreNodeClasses: ["post-tags", "pcsl-title", "heateor_sss_sharing_container", "penci-post-countview-number-check"],
                    ignoreTexts: ["در این زمینه"]
                },               
                comments: {
                    container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".comments .comment"),
                    author: ".author span",
                    datetime: ".date",
                    text: ".comment-content p"
                },
                tags: ".post-tags a"           
            },
        })
    }
}

export class euronews extends clsScrapper {
    constructor() {
        super(enuDomains.euronews, "parsi.euronews.com", {
            selectors: {
                article: "article.o-article-newsy",
                title: "h1",
                summary: "p.c-article-summary",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
                    splitter: (el: HTMLElement) => el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: ".c-article-content",
                    ignoreNodeClasses: ["widget--type-related", "c-ad", "c-article-you-might-also-like"],
                    ignoreTexts: [/.*به کانال تلگرام یورونیوز.*/]
                },               
                category: {
                    selector: "#adb-article-breadcrumb a",
                },
                tags: "#adb-article-tags div a"           
            },
        })
    }

    protected normalizePath(url: URL): string {
        if (url.pathname.includes("parsi.euronews.com")) {
            return url.toString().replace("/parsi.euronews.com", "")
        } else
            return url.toString()
    }
}

export class peivast extends clsScrapper {
    constructor() {
        super(enuDomains.peivast, "peivast.com", {
            selectors: {
                article: "body.single-post",
                title: "h1",
                summary: ".grayboxe",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: ".single-blog-content",
                    ignoreNodeClasses: ["grayboxe"],
                },               
                category: {
                    selector: "#breadcrumbs span span a",
                    startIndex: 1
                },
                tags: ".post-tags a"           
            },
        })
    }
}

export class trt extends clsScrapper {
    constructor() {
        super(enuDomains.trt, "trt.net.tr", {
            basePath: "/persian",
            selectors: {
                article: "body.lang-fa-IR article",
                title: "h1",
                summary: "h2",
                datetime: {
                    conatiner: "time",
                    splitter: (el: HTMLElement) => el.textContent?.substring(0,10).split(".").reverse().join("/") || "NO_DATE"
                },
                content: {
                    main: ".formatted",
                    ignoreNodeClasses: ["tags"],
                },               
                category: {
                    selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.breadcrumb li a"),
                    lastIndex: 2
                },
                tags: ".tags a"           
            },
            url: {
                extraInvalidStartPaths: ["/afghaniuzbek", "/armenian", "/azerbaycan", "/turki", "/bulgarian", "/chinese",
                  "/dari", "/georgian", "/greek", "/magyar", "/italiano", "/kazakh", "/kyrgyz", "/pashto", "/portuguese",
                  "/romana", "/espanol", "/tatarca", "/tatarca", "/turkmen", "/turkmence", "/urdu", "/uyghur", "/uzbek"]
            }
        })
    }
}

export class aa extends clsScrapper {
    constructor() {
        super(enuDomains.aa, "aa.com.tr", {
            basePath: "/fa",
            selectors: {
                article: ".print",
                title: "h1",
                subtitle: "h4",
                datetime: {
                    conatiner: ".tarih",
                    splitter: (el: HTMLElement) => el.textContent?.substring(0,10).split(".").reverse().join("/") || "NO_DATE"
                },
                content: {
                    main: ".detay-icerik >  div:nth-child(2)",
                    ignoreNodeClasses: ["detay-foto-editor", "sticky-top", "detay-paylas"],
                },               
                category: {
                    selector: ".detay-news-category a",
                },
                tags: ".detay-paylas > div:nth-child(2) > a"           
            },
            url: {
                extraInvalidStartPaths: ["/ba", "/kk", "/ks", "/sq", "/mk", "id"]
            }
        })
    }
}

export class armradio extends clsScrapper {
    constructor() {
        super(enuDomains.armradio, "fa.armradio.am", {
            selectors: {
                article: "#the-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: ".entry-content",
                },
                category: {
                    selector: "a.post-cat"
                }
            },
            url: {
                removeWWW: true,
            }
        })
    }
}

export class arannews extends clsScrapper {
    constructor() {
        super(enuDomains.arannews, "fa.arannews.com", {
            selectors: {
                article: ".moduletable.MP.PrintContentPage",
                title: "#ctl01_lblhead",
                summary: "#ctl01_divIntroText",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("#ctl01_lblCreatedDate"),
                },
                content: {
                    main: ".opinion-div-fulltext-news",
                },
                tags: ".tag-Keywords li a"
            },
            url: {
                removeWWW: true,
                forceHTTP: true
            }
        })
    }
}

export class ariananews extends clsScrapper {
    constructor() {
        super(enuDomains.ariananews, "ariananews.af", {
            basePath: "/fa",
            selectors: {
                article: "[lang='fa-IR'] body.single-post",
                title: "h1",
                datetime: {
                    conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time']"),
                    splitter: (el: HTMLElement) => el.getAttribute("content")?.substring(0, 10) || "NO_DATE"
                },
                content: {
                    main: "#mvp-content-main",
                    ignoreNodeClasses: ["sharethis-inline-share-buttons"],
                    ignoreTexts: [/.*Updated.*/]
                },               
                category: {
                    selector: "#mvp-post-head span.mvp-post-cat",
                },
                tags: ".mvp-post-tags span a"           
            },
        })
    }
}
