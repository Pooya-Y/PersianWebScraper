import { clsScrapper } from "../modules/clsScrapper";
import { enuDomains, IntfProxy } from "../modules/interfaces";
import { HTMLElement } from "node-html-parser"
import { getArvanCookie } from "../modules/request";

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
}
export class dotic extends clsScrapper {
  constructor() {
    super(enuDomains.dotic, "dotic.ir", {
      selectors: {
        article: ".details_right",
        title: ".title",
        subtitle: ".lead",
        datetime: {
          conatiner: ".details_right_info li:nth-child(2)",
          splitter: (el: HTMLElement) => super.extractDate(el, el.classList.contains("comment-date") ? " " : "|") || "DATE NOT FOUND",
        },
        content: {
          main: ".matn",
          ignoreNodeClasses: ["pull-left"]
        },
        category: {
          selector: ".tags:nth-child(2) a"
        },
        tags: ".tags:nth-child(3) a"
      },
      url: { removeWWW: true }
    })
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  }

  async initialCookie(proxy?: IntfProxy, url?: string) {
    return await getArvanCookie(url || "https://dotic.ir", this.baseURL, proxy)
  }
}

export class ekhtebar extends clsScrapper {
  constructor() {
    super(enuDomains.ekhtebar, "ekhtebar.ir", {
      selectors: {
        article: "#the-post",
        title: ".entry-title",
        subtitle: ".lead",
        datetime: {
          conatiner: ".date",
        },
        content: {
          main: ".entry-content",
          ignoreNodeClasses: ["ez-toc-container", "ez-toc-title-container", "post-bottom-meta", "ez-toc-list"],
          ignoreTexts: ["بیشتر بخوانید:"]
        },
        category: {
          selector: "#breadcrumb a",
          startIndex: 1
        },
        tags: ".tagcloud a"
      },
      url: { removeWWW: true }
    })
  }

}

export class qavanin extends clsScrapper {
  constructor() {
    super(enuDomains.qavanin, "qavanin.ir", {
      selectors: {
        article: "section.normal-section#about",
        title: "h1",
        subtitle: "h2",
        datetime: {
          conatiner: "h2",
          splitter: (el: HTMLElement) => super.extractDate(el.innerText.replace("مصوب ", "").replace(/ .*/, ""), " ") || "DATE NOT FOUND"
        },
        content: {
          main: "#treeText",
          ignoreTexts: ["متن این مصوبه هنوز وارد سامانه نشده است لطفا قسمت تصویر را نیز ملاحظه فرمایید."]
        },
        category: {
          selector: "#breadcrumb a",
          startIndex: 1
        },
        tags: ".tagcloud a"
      },
      url: { removeWWW: true }
    })
  }
  async initialCookie(proxy?: IntfProxy, url?: string) {
    return await getArvanCookie(url || "https://dotic.ir", this.baseURL, proxy)
  }
}

export class rcmajlis extends clsScrapper {
  constructor() {
    super(enuDomains.rcmajlis, "rc.majlis.ir", {
      selectors: {
        article: "section.normal-section#about",
        title: "h1",
        subtitle: "h2",
        datetime: {
          conatiner: "h2",
          splitter: (el: HTMLElement) => super.extractDate(el.innerText.replace("مصوب ", "").replace(/ .*/, ""), " ") || "DATE NOT FOUND"
        },
        content: {
          main: "#treeText",
          ignoreTexts: ["متن این مصوبه هنوز وارد سامانه نشده است لطفا قسمت تصویر را نیز ملاحظه فرمایید."]
        },
        category: {
          selector: "#breadcrumb a",
          startIndex: 1
        },
        tags: ".tagcloud a"
      },
      url: { removeWWW: true }
    })
  }
  async initialCookie(proxy?: IntfProxy, url?: string) {
    return await getArvanCookie(url || "https://dotic.ir", this.baseURL, proxy)
  }
}
