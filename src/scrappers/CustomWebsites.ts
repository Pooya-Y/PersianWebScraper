import { clsScrapper } from "../modules/clsScrapper";
import { enuDomains, enuMajorCategory, enuMinorCategory, enuSubMinorCategory, enuTextType, IntfMappedCategory } from "../modules/interfaces";
import { HTMLElement, parse } from "node-html-parser"
//import { normalizeText } from "../modules/common";

export class divar extends clsScrapper {
  constructor() {
    super(enuDomains.divar, "divar.ir", {
      basePath: "/s/iran",
      selectors: {
        article: "article .kt-row",
        title: ".kt-page-title__title",
        subtitle: ".kt-page-title__subtitle",
        datetime: {
          acceptNoDate: true
        },
        content: {
          main: "p.kt-description-row__text, .kt-col-5 section:nth-child(1) .post-page__section--padded, img.kt-image-block__image",
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.kt-breadcrumbs li a")
        },
        tags: "nav .kt-wrapper-row a button"
      }
    })
  }
  protected mapCategoryImpl(): IntfMappedCategory {
    return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog }
  }
}

export class extern extends clsScrapper {
  constructor() {
    super(enuDomains.extern, "extern.ir", {
      selectors: {
        article: "body.single",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
          splitter: (el: HTMLElement) => el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
        },
        content: {
          main: ".paper__content, figure.paper__thumbnail",
          ignoreNodeClasses: ["toc"]
        },
        category: {
          selector: "nav.rank-math-breadcrumb p a"
        },
        tags: "a[rel='tag']",
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comments__list li article"),
          author: ".comment__author .fn",
          datetime: "time",
          text: ".comment__content"
        }
      },
    })
  }

  mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
    const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.Medical }
    if (!cat) return mappedCat
    void cat, first, second

    if (second.startsWith("سلامتی")) return { ...mappedCat, minor: enuMinorCategory.Health }
    if (second.startsWith("اخبار")) return { ...mappedCat, major: enuMajorCategory.News, minor: enuMinorCategory.Health }
    if (second.startsWith("سؤالات")) return { ...mappedCat, subminor: enuMinorCategory.FAQ }
    if (second.startsWith("کتاب‌ها")) return { ...mappedCat, subminor: enuMinorCategory.Education }
    if (second.startsWith("آموزش")) return { ...mappedCat, subminor: enuMinorCategory.Education }
    return mappedCat
  }
}

export class rastineh extends clsScrapper {
  constructor() {
    super(enuDomains.rastineh, "rastineh.com", {
      selectors: {
        article: ".single_page article",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time'], time"),
          splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.split("T").at(0) || "NO_DATE"
        },
        content: {
          main: ".single_content",
          ignoreNodeClasses: ["su-spoiler"]
        },
        category: {
          selector: "#crumbs a",
          startIndex: 1
        },
        tags: "a[rel='tag']",
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li .comment-body"),
          author: ".comment-author cite",
          text: "p"
        }
      },
    })
  }
  protected mapCategoryImpl(): IntfMappedCategory {
    return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.Health }
  }
}

export class rasekhoon extends clsScrapper {
  constructor() {
    super(enuDomains.rasekhoon, "rasekhoon.net", {
      selectors: {
        article: ".js_ConID .MainIntra",
        title: "h1",
        subtitle: ".Sootitr",
        datetime: {
          conatiner: ".Date"
        },
        content: {
          main: "article, img.ira",
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("nav.SubNav div a")
        },
      },
      url: {
        removeWWW: true
      }
    })
  }
  mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
    const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.News }
    if (!cat) return mappedCat
    void cat, first, second

    if (first === "مقالات" || first === "ویژه نامه")
      first = second

    if (first.includes("اجتماعی")) return { ...mappedCat, minor: enuMinorCategory.Social }
    if (first.includes("استان")) return { ...mappedCat, minor: enuMinorCategory.Local }
    if (first.includes("اقتصاد") || second.startsWith("بازار")) return { ...mappedCat, minor: enuMinorCategory.Economics }
    if (first.includes("الملل")) return { ...mappedCat, minor: enuMinorCategory.Political, subminor: enuSubMinorCategory.Intl }
    if (first.includes("سیاسی")) return { ...mappedCat, minor: enuMinorCategory.Political }
    if (first.includes("علمی")) return { ...mappedCat, minor: enuMinorCategory.ScienceTech }
    if (first.includes("فرهنگی")) return { ...mappedCat, minor: enuMinorCategory.Culture }
    if (first.includes("هنری")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Art }
    if (first.includes("مشاهیر")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Celebrities }
    if (first.includes("ورزشی")) return { ...mappedCat, minor: enuMinorCategory.Sport }
    if (first.includes("آموزش")) return { ...mappedCat, minor: enuMinorCategory.Education }
    if (first.includes("مشاوره")) return { ...mappedCat, minor: enuMinorCategory.Psychology }
    if (first.includes("ادبیات")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuMinorCategory.Literature }
    if (first.includes("سینما") || cat.startsWith("ویدئو")) return { ...mappedCat, minor: enuMinorCategory.Culture, subminor: enuSubMinorCategory.Cinema }
    if (first.includes("بهداشت")) return { ...mappedCat, minor: enuMinorCategory.Social, subminor: enuMinorCategory.Health }
    if (first.includes("پزشکی")) return { ...mappedCat, minor: enuMinorCategory.Medical }
    if (first.includes("احادیث")
      || first.includes("مهدویت")
      || first.includes("وقف")
      || first.includes("دین پژوهی")
      || first.includes("حکومت دینی")
    ) return { ...mappedCat, minor: enuMinorCategory.Religious }
    if (first.includes("پیامک")
      || first.includes("کارت پستال")
    ) return { ...mappedCat, minor: enuMinorCategory.Fun }
    if (first.includes("گالری تصاویر")) return { ...mappedCat, minor: enuMinorCategory.Multimedia }
    if (first.includes("تاریخ")) return { ...mappedCat, minor: enuMinorCategory.Historical }
    if (first.includes("نرم افزار")) return { ...mappedCat, minor: enuMinorCategory.IT, subminor: enuSubMinorCategory.Software }

    return mappedCat
  }
}

export class eporsesh extends clsScrapper {
  constructor() {
    super(enuDomains.eporsesh, "eporsesh.com", {
      selectors: {
        article: ".node-historyquestioncontent.view-mode-full, body.node-type-article, body.node-type-picnews, body.node-type-montakhabepayamaki",
        title: (_, fullHtml: HTMLElement) => fullHtml.querySelector("h1"),
        subtitle: ".Sootitr",
        datetime: {
          acceptNoDate: true
        },
        content: {
          main: ".group-header, .field-name-field-image div div, .field-type-text-with-summary div div, .flexslider ul li," +
            ".field-name-field-picnews-headpic div div, .field-name-field-montakhabepayamaki-questio div div",
          ignoreTexts: [/.*eitaa.*/]
        },
        category: {
          selector: "[property='rdfs:label skos:prefLabel']"
        },
      },
      url: {
        removeWWW: true
      }
    })
  }
  protected mapCategoryImpl(): IntfMappedCategory {
    return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.Religious }
  }

}

export class nazaratshora extends clsScrapper {
  constructor() {
    super(enuDomains.nazaratshora, "nazarat.shora-rc.ir", {
      selectors: {
        article: "#panel_SiteMaster pre",
        acceptNoTitle: true,
        datetime: {
          acceptNoDate: true
        },
        content: {
          main: (_, fullHtml: HTMLElement) => {
            const content = fullHtml.querySelectorAll("#panel_SiteMaster")[0]?.childNodes[1].childNodes[3].childNodes[1].rawText
            return [parse(content)]
          },
        },
      },
      url: {
        removeWWW: true,
        forceHTTP: true
      }
    })
  }
}

export class sariasan extends clsScrapper {
  constructor() {
    super(enuDomains.sariasan, "sariasan.com", {
      selectors: {
        article: "body.single-post",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
          splitter: (el: HTMLElement) => el.getAttribute("datetime") || "NO_DATE"
        },
        content: {
          main: ".post_content .wprt-container",
          ignoreNodeClasses: ["saria-content_1"],
          ignoreTexts: [/.*دانلود کنید:.*/, /.*اینجا کلیک کنید.*/, /.*حتما بخوانید:.*/, /.*همه زبان های برنامه نویسی.*/, /.*<img.*/]
        },
        comments: {
          container: "ul.w-comments-list li",
          author: ".w-comments-item-author",
          text: ".w-comments-item-text"
        },
        category: {
          selector: ".rank-math-breadcrumb p a"
        },
        tags: "[rel='tag']"
      },
    })
  }
  protected mapCategoryImpl(): IntfMappedCategory {
    return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.Education, subminor: enuSubMinorCategory.Software }
  }
}

export class mihandownload extends clsScrapper {
  constructor() {
    super(enuDomains.mihandownload, "mihandownload.com", {
      selectors: {
        article: "#pri",
        title: ".title-post-main a",
        datetime: {
          conatiner: ".dates "
        },
        content: {
          main: ".content-post-main",
          ignoreNodeClasses: ["wp-block-buttons"],
        },
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.commentlist li .comment-body"),
          author: ".comment-author cite.fn",
          text: "p"
        },
        category: {
          selector: ".category a"
        },
        tags: "[rel='tag']"
      },
      url: {
        removeWWW: true
      }
    })
  }
  protected mapCategoryImpl(): IntfMappedCategory {
    return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, subminor: enuSubMinorCategory.Software }
  }
}

export class uptvs extends clsScrapper {
  constructor() {
    super(enuDomains.uptvs, "uptvs.com", {
      selectors: {
        article: "body.single-post",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time'], time"),
          splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.split("T").at(0) || "NO_DATE"
        },
        content: {
          main: ".post-content .text-lg-right, img.top-single-img",
          //ignoreNodeClasses: ["wp-block-buttons"],
        },
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".comment-body"),
          author: ".vcard .pr-half span:nth-child(1)",
          text: ".pr-lg-45 p"
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("span.category_post a")
        },
      },
    })
  }
  protected mapCategoryImpl(): IntfMappedCategory {
    return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.Multimedia, subminor: enuSubMinorCategory.Cinema }
  }
}

export class mihanwp extends clsScrapper {
  constructor() {
    super(enuDomains.mihanwp, "mihanwp.com", {
      selectors: {
        article: ".single-post",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
          splitter: (el: HTMLElement) => el.getAttribute("datetime") || "NO_DATE"
        },
        content: {
          main: "article",
          ignoreNodeClasses: ["clearfix", "rmp-widgets-container", "ez-toc-v2_0_61", "wp-block-heading"],
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".rank-math-breadcrumb p a"),
        },
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li"),
          author: ".comment-author-name",
          text: ".comment-block p"
        }
      },
    })
  }
  protected normalizeCategoryImpl(cat?: string | undefined): string | undefined {
    return cat?.replace(/^خانه\//, "").trim()
  }
  protected mapCategoryImpl(): IntfMappedCategory {
    return { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.IT, subminor: enuSubMinorCategory.Software }
  }

}

export class noozdahkala extends clsScrapper {
  constructor() {
    super(enuDomains.noozdahkala, "19kala.com", {
      selectors: {
        article: ".product-page-content",
        title: "h1",
        datetime: {
          acceptNoDate: true
        },
        content: {
          main: ".tabs-content, #tab-specification",
        },
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("#review .table tbody"),
          text: "tr:nth-child(2) td .col-md-9"
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ul.breadcrumb li a")
        },
        tags: "[rel='tag']"
      },
    })
  }
  protected normalizeCategoryImpl(cat?: string | undefined): string | undefined {
    return cat?.replace(/^فروشگاه اینترنتی 19کالا\//, "").trim()
  }
  protected mapCategoryImpl(category: string | undefined, first: string, second: string): IntfMappedCategory {
    const mappedCat: IntfMappedCategory = { textType: enuTextType.Formal, major: enuMajorCategory.Weblog, minor: enuMinorCategory.ICT }
    void category, first, second
    if (first.includes("کامپیوتر")) return { ...mappedCat, subminor: enuSubMinorCategory.Hardware }
    if (first.includes("جانبی")) return { ...mappedCat, subminor: enuSubMinorCategory.Gadgets }
    if (first.includes("تجهیزات")) return { ...mappedCat, subminor: enuSubMinorCategory.Gadgets }
    if (first.includes("موبایل")) return { ...mappedCat, subminor: enuSubMinorCategory.Mobile }

    return mappedCat
  }
}

export class arda extends clsScrapper {
  constructor() {
      super(enuDomains.arda, "arda.ir", {
          selectors: {
              article: "body.single-post, [data-pagecontroller='topic']",
              title: "h1",
              datetime: {
                  conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time'], time"),
                  splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
              },
              content: {
                  main: ".entry",
                  ignoreTexts: [/.*<img.*/]
              },
              comments: {
                  container: "ol.commentlist li .comment, #elPostFeed article",
                  author: ".author-comment cite, .cAuthorPane_author strong",
                  datetime: "time",
                  text: ".comment-content, [data-role='commentContent']"
              },
              category: {
                selector: "#crumbs a, nav.ipsBreadcrumb_top [data-role='breadcrumbList'] li a",
                startIndex: 1
              },    
              tags: ".ipsTags a"     
          },
          url: {
              removeWWW: true
          }
      })
  }
}

export class jadoogaran extends clsScrapper {
  constructor() {
      super(enuDomains.jadoogaran, "jadoogaran.org", {
          selectors: {
              article: ".mohtava",
              title: "h4, .thread_title_bar .col-md-6, h2.article-title",
              summary: ".article-summary span.article-content",
              datetime: {
                  conatiner: ".itemInfo > div > small, .thread_title_bar div.col-md-7, div.article-meta span:nth-child(4)",
                  splitter: "|",
                  acceptNoDate: true
              },
              content: {
                  main: ".itemText, .article-text",
                  ignoreNodeClasses: ["ppy-imglist"]
              },
              comments: {
                  container: ".thread_body",
                  author: ".comUserName",
                  text: ".thread_text"
              },
              category: {
                selector: ".forum_header > .forum_title > a, .newsroom_headertable span a, .article-breadcrumbs a",
                lastIndex: 2
              },    
              tags: ".xoops-tag-bar ul li a, .article-content a"     
          },
          url: {
            extraInvalidStartPaths: ["/extgallery", "/thumbnails"]
          }
      })
  }
}