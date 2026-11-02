const holidayData = {
    // 固定節日
    fixed: {
        '1-1': { name: '元旦', isHoliday: true },
        '1-19': { name: '消防節', isHoliday: false }, // 依主管機關規定放假
        '2-14': { name: '西洋情人節', isHoliday: false },
        '2-28': { name: '和平紀念日', isHoliday: true },
        '3-8': { name: '婦女節', isHoliday: false },
        '3-12': { name: '國父逝世紀念日/植樹節', isHoliday: false },
        '3-14': { name: '反侵略日/白色情人節', isHoliday: false },
        '3-21': { name: '民族平等紀念日', isHoliday: false },
        '3-29': { name: '革命先烈紀念日/青年節', isHoliday: false },
        '3-30': { name: '國際醫師節', isHoliday: false },
        '4-1': { name: '愚人節', isHoliday: false },
        '4-4': { name: '兒童節', isHoliday: true }, // 依第六條規定放假
        '4-7': { name: '言論自由日', isHoliday: false },
        '5-1': { name: '勞動節', isHoliday: true }, // 依第六條規定放假
        '5-12': { name: '國際護理師節', isHoliday: false },
        '6-5': { name: '環境日', isHoliday: false },
        '6-8': { name: '國家海洋日', isHoliday: false },
        '6-15': { name: '警察節', isHoliday: false }, // 依主管機關規定放假
        '6-26': { name: '原住民族抵抗日', isHoliday: false },
        '7-1': { name: '漁民節', isHoliday: false },
        '7-15': { name: '解嚴紀念日', isHoliday: false },
        '8-1': { name: '原住民族日', isHoliday: false },
        '8-8': { name: '父親節', isHoliday: false },
        '8-15': { name: '終戰紀念日', isHoliday: false },
        '8-23': { name: '八二三紀念日', isHoliday: false },
        '9-3': { name: '軍人節', isHoliday: false }, // 依國防部規定放假
        '9-9': { name: '國民體育日', isHoliday: false },
        '9-21': { name: '國家防災日', isHoliday: false },
        '9-28': { name: '孔子誕辰紀念日/教師節', isHoliday: true },
        '10-10': { name: '國慶日', isHoliday: true },
        '10-24': { name: '臺灣聯合國日', isHoliday: false },
        '10-25': { name: '臺灣光復暨金門古寧頭大捷紀念日', isHoliday: true },
        '10-31': { name: '萬聖節', isHoliday: false },
        '11-8': { name: '海巡節', isHoliday: false }, // 依海洋委員會規定放假
        '11-12': { name: '國父誕辰紀念日/中華文化復興節', isHoliday: false },
        '12-3': { name: '身心障礙者日', isHoliday: false },
        '12-10': { name: '人權日', isHoliday: false },
        '12-18': { name: '移民日', isHoliday: false },
        '12-24': { name: '平安夜', isHoliday: false },
        '12-25': { name: '行憲紀念日/聖誕節', isHoliday: true },
        '12-28': { name: '全國客家日', isHoliday: false },
        '12-31': { name: '跨年', isHoliday: false }
    },
    // 特定年份的節日
    yearly: {
        2026: {
            // 依據行政院人事行政總處公布 115 年政府行政機關辦公日曆表
            // 全年放假 120 天，9 次連續假期，不再補班

            // 農民節（立春日）
            '2-4': { name: '農民節', isHoliday: false },

            // 春節連假 2/14(六)～2/22(日)，共 9 天
            '2-15': { name: '除夕前一日（小年夜）', isHoliday: true }, // 週日，補假於 2/20
            '2-16': { name: '除夕', isHoliday: true },
            '2-17': { name: '春節', isHoliday: true }, // 初一
            '2-18': { name: '春節', isHoliday: true }, // 初二
            '2-19': { name: '春節', isHoliday: true }, // 初三
            '2-20': { name: '春節補假', isHoliday: true }, // 小年夜逢週日補假

            // 和平紀念日連假 2/27(五)～3/1(日)，共 3 天
            '2-27': { name: '和平紀念日補假', isHoliday: true }, // 2/28 逢週六補假

            // 元宵節（農曆一月十五日）
            '3-3': { name: '元宵節', isHoliday: false },

            // 兒童節及清明節連假 4/3(五)～4/6(一)，共 4 天
            '4-3': { name: '兒童節補假', isHoliday: true }, // 4/4 兒童節逢週六，前一日補假
            '4-5': { name: '清明節', isHoliday: true }, // 清明日
            '4-6': { name: '清明節補假', isHoliday: true }, // 4/5 清明節逢週日，後一日補假

            // 母親節（五月第二個星期日）
            '5-10': { name: '母親節', isHoliday: false },

            // 佛陀誕辰日（農曆四月八日）
            '5-24': { name: '佛陀誕辰日', isHoliday: false },

            // 端午節連假 6/19(五)～6/21(日)，共 3 天
            '6-19': { name: '端午節', isHoliday: true }, // 農曆五月五日

            // 中元節（農曆七月十五日）
            '8-27': { name: '中元節', isHoliday: false },

            // 祖父母節（八月第四個星期日）
            '8-23': { name: '祖父母節', isHoliday: false },

            // 中秋節及教師節連假 9/25(五)～9/28(一)，共 4 天
            '9-25': { name: '中秋節', isHoliday: true }, // 農曆八月十五日

            // 國慶日連假 10/9(五)～10/11(日)，共 3 天
            '10-9': { name: '國慶日補假', isHoliday: true }, // 10/10 逢週六補假

            // 重陽節（農曆九月九日）
            '10-18': { name: '重陽節', isHoliday: false },

            // 臺灣光復暨金門古寧頭大捷紀念日連假 10/24(六)～10/26(一)，共 3 天
            '10-26': { name: '臺灣光復暨金門古寧頭大捷紀念日補假', isHoliday: true } // 10/25 逢週日補假

            // 行憲紀念日連假 12/25(五)～12/27(日)，共 3 天（12/25 已列於固定節日）

            // 原住民族歲時祭儀（擇定三日）由原住民族委員會公告，暫不列出
        },
        2027: {
            // 依據行政院人事行政總處 115 年 5 月 21 日公布 116 年政府行政機關辦公日曆表
            // 全年放假 121 天，9 次 3 天以上連續假期，無補班日

            // 春節連假 2/4(四)～2/10(三)，共 7 天
            '2-4': { name: '除夕前一日（小年夜）/農民節', isHoliday: true }, // 適逢立春日
            '2-5': { name: '除夕', isHoliday: true },
            '2-6': { name: '春節', isHoliday: true }, // 初一，逢週六
            '2-7': { name: '春節', isHoliday: true }, // 初二，逢週日
            '2-8': { name: '春節', isHoliday: true }, // 初三
            '2-9': { name: '春節補假', isHoliday: true }, // 初一（2/6）逢週六補假
            '2-10': { name: '春節補假', isHoliday: true }, // 初二（2/7）逢週日補假

            // 元宵節（農曆一月十五日）
            '2-20': { name: '元宵節', isHoliday: false },

            // 和平紀念日連假 2/27(六)～3/1(一)，共 3 天
            '3-1': { name: '和平紀念日補假', isHoliday: true }, // 2/28 逢週日補假

            // 兒童節及清明節連假 4/3(六)～4/6(二)，共 4 天
            '4-5': { name: '清明節', isHoliday: true }, // 清明日
            '4-6': { name: '兒童節補假', isHoliday: true }, // 4/4 兒童節逢週日，於清明節次日補假

            // 勞動節連假 4/30(五)～5/2(日)，共 3 天
            '4-30': { name: '勞動節補假', isHoliday: true }, // 5/1 勞動節逢週六，前一個上班日補假

            // 母親節（五月第二個星期日）
            '5-9': { name: '母親節', isHoliday: false },

            // 佛陀誕辰日（農曆四月八日）
            '5-13': { name: '佛陀誕辰日', isHoliday: false },

            // 端午節（農曆五月五日）
            '6-9': { name: '端午節', isHoliday: true },

            // 中元節（農曆七月十五日）
            '8-16': { name: '中元節', isHoliday: false },

            // 祖父母節（八月第四個星期日）
            '8-22': { name: '祖父母節', isHoliday: false },

            // 中秋節（農曆八月十五日）
            '9-15': { name: '中秋節', isHoliday: true },

            // 重陽節（農曆九月九日）
            '10-8': { name: '重陽節', isHoliday: false },

            // 國慶日連假 10/9(六)～10/11(一)，共 3 天
            '10-11': { name: '國慶日補假', isHoliday: true }, // 10/10 逢週日補假

            // 臺灣光復暨金門古寧頭大捷紀念日連假 10/23(六)～10/25(一)，共 3 天（10/25 已列於固定節日）

            // 行憲紀念日連假 12/24(五)～12/26(日)，共 3 天
            '12-24': { name: '行憲紀念日補假', isHoliday: true }, // 12/25 逢週六，前一個上班日補假

            // 117 年中華民國開國紀念日連假 12/31(五)～1/2(日)，共 3 天
            '12-31': { name: '開國紀念日補假', isHoliday: true } // 117/1/1 逢週六，前一個上班日補假

            // 原住民族歲時祭儀（擇定三日）由原住民族委員會公告，暫不列出
        }
    }
};

function getHolidays(year) {
    const holidays = { ...holidayData.fixed };
    if (holidayData.yearly[year]) {
        Object.assign(holidays, holidayData.yearly[year]);
    }
    return holidays;
}

export { getHolidays };
