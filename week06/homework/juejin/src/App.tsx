import { useEffect, useMemo, useState } from "react";

import { fetchBookletList, fetchByteCourseList, fetchCategoryList } from "./api";
import type { BookletItem, ByteCourseItem, CategoryItem } from "./types";

type CourseType = "booklet" | "byte-course";
type SortKey = "all" | "latest" | "hot" | "price";
type PriceOrder = "desc" | "asc";

const COURSE_OPTIONS: Array<{ key: CourseType; label: string; tag?: string }> = [
  { key: "booklet", label: "掘金小册" },
  { key: "byte-course", label: "字节内部课", tag: "VIP免费" },
];

const SORT_OPTIONS: Array<{ key: Exclude<SortKey, "price">; label: string; value: number }> = [
  { key: "all", label: "全部", value: 10 },
  { key: "latest", label: "最新", value: 1 },
  { key: "hot", label: "热销", value: 7 },
];

const getPriceSort = (order: PriceOrder) => (order === "desc" ? 9 : 8);

const money = (amount: number) => {
  const value = (amount / 100).toFixed(2).replace(/\.?0+$/, "");
  return `¥${value}`;
};

const getDiscountLabel = (booklet: BookletItem) =>
  booklet.max_discount?.name || booklet.event_discount?.show_label || "";

const getSortValue = (sortKey: SortKey, priceOrder: PriceOrder) => {
  if (sortKey === "price") {
    return getPriceSort(priceOrder);
  }
  return SORT_OPTIONS.find((item) => item.key === sortKey)?.value ?? 10;
};

const formatDuration = (durationMs: number) => {
  if (!durationMs || durationMs <= 0) {
    return "";
  }
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${Math.max(minutes, 1)}分钟`;
};

const ASSET_PREFIX = process.env.NODE_ENV === "development" ? "/assets" : "./assets";
const getAssetUrl = (fileName: string) => `${ASSET_PREFIX}/${fileName}`;

const BYTETECH_ICON_URL = getAssetUrl("icon-bytetech.png");

const RANK_ICON_MAP: Record<number, string> = {
  1: getAssetUrl("rank-lv1.avis"),
  2: getAssetUrl("rank-lv2.avis"),
  3: getAssetUrl("rank-lv2.avis"),
  4: getAssetUrl("rank-lv5.avis"),
  5: getAssetUrl("rank-lv5.avis"),
  6: getAssetUrl("rank-lv7.avis"),
  7: getAssetUrl("rank-lv7.avis"),
  8: getAssetUrl("rank-lv8.avis"),
};

const getRankIconUrl = (level: number) => RANK_ICON_MAP[level];

const BookletCard = ({ item }: { item: BookletItem }) => {
  const title = item.base_info.title.trim();
  const summary = item.base_info.summary.trim();
  const price = item.max_discount?.pay_money ?? item.base_info.price;
  const originPrice = item.max_discount?.price ?? item.base_info.price;
  const discountLabel = getDiscountLabel(item);
  const metaLine = `已更新 ${item.section_updated_count} 小节 · ${item.base_info.buy_count}人已购买`;
  const authorName = item.user_info.user_name;
  const rankIconUrl = getRankIconUrl(item.user_info.level);

  return (
    <article className="flex gap-4 border-b border-jj-border py-5">
      <img
        className="h-[140px] w-[100px] rounded-md object-cover md:h-[160px] md:w-[114px]"
        src={item.base_info.cover_img}
        alt={title}
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          {item.is_new ? (
            <span className="rounded bg-[#f53f3f] px-1.5 py-0.5 text-xs text-white">新品</span>
          ) : null}
          {item.base_info.can_vip_borrow ? <span className="vip-borrow-badge">VIP</span> : null}
          <h3 className="line-clamp-1 text-[22px] leading-8 text-jj-text">{title}</h3>
        </div>
        <p className="line-clamp-1 text-base text-jj-text">{summary}</p>
        <div className="mt-2 flex items-center gap-2 text-[18px] text-jj-subtext">
          <img
            className="h-6 w-6 rounded-full object-cover"
            src={item.user_info.avatar_large}
            alt=""
          />
          <span className="line-clamp-1 text-[#1e2738]">{authorName}</span>
          {rankIconUrl ? (
            <img
              className="h-4 w-[35px] object-contain"
              src={rankIconUrl}
              alt={`创作等级LV.${item.user_info.level}`}
              title={`创作等级LV.${item.user_info.level}`}
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-jj-subtext">
          <span className="text-[34px] leading-none text-[#f53f3f]">{money(price)}</span>
          {originPrice > price ? (
            <span className="text-2xl text-[#9ca3af] line-through">{money(originPrice)}</span>
          ) : null}
          <span className="text-lg">{metaLine}</span>
        </div>
        {discountLabel ? (
          <div className="sale-tooltip-wrap mt-2">
            <div className="sale-tooltip">{discountLabel}</div>
          </div>
        ) : null}
      </div>
    </article>
  );
};

const ByteCourseCard = ({ item }: { item: ByteCourseItem }) => {
  const title = item.content.name.trim();
  const summary = item.content.abstract.trim();
  const chapterCount = item.content.extra?.course_package?.chapter_count ?? 0;
  const duration = formatDuration(item.content.extra?.course_package?.duration ?? 0) || "0分钟";
  const videoMeta = `${chapterCount}个视频 · ${duration}`;

  return (
    <article className="flex gap-4 border-b border-jj-border py-5">
      <img
        className="h-[88px] w-[156px] rounded-md object-cover md:h-[128px] md:w-[228px]"
        src={item.content.cover_image.url}
        alt={title}
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="vip-free-badge">VIP免费</span>
          <h3 className="line-clamp-1 text-[22px] leading-8 text-jj-text">{title}</h3>
        </div>
        <p className="line-clamp-1 text-base text-jj-text">{summary}</p>
        <div className="mt-1.5 flex h-[26px] items-center text-[15px] text-[#515767]">
          <img src={BYTETECH_ICON_URL} className="mr-2 h-[18px] w-[18px]" alt="" />
          <span>ByteTech</span>
        </div>
        <div className="mt-4 flex items-center text-[14px] leading-[22px] text-[#515767]">
          <ByteCourseVideoIcon />
          <span className="ml-1.5">{videoMeta}</span>
        </div>
      </div>
    </article>
  );
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#76809d]" aria-hidden>
    <path
      fill="currentColor"
      d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 2a6 6 0 1 0 3.87 10.58l4.27 4.28 1.42-1.42-4.28-4.27A6 6 0 0 0 10 4Z"
    />
  </svg>
);

const ByteCourseVideoIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-[#515767]"
    aria-hidden
  >
    <path
      d="M4.32253 13.2286C3.62016 13.2286 3.05078 12.6593 3.05078 11.9569V5.05469C3.05078 3.95012 3.94621 3.05469 5.05078 3.05469H11.953C12.6554 3.05469 13.2247 3.62407 13.2247 4.32643"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />
    <rect
      x="6.25039"
      y="6.24844"
      width="10.7275"
      height="10.7275"
      rx="1.6"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path
      d="M13.7117 11.2915L10.778 9.49607C10.5212 9.33889 10.1914 9.52371 10.1914 9.8248L10.1914 13.4158C10.1914 13.7168 10.5212 13.9017 10.778 13.7445L13.7117 11.949C13.9574 11.7987 13.9574 11.4419 13.7117 11.2915Z"
      fill="currentColor"
    />
  </svg>
);

function App() {
  const [courseType, setCourseType] = useState<CourseType>("booklet");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("0");
  const [sortKey, setSortKey] = useState<SortKey>("all");
  const [priceOrder, setPriceOrder] = useState<PriceOrder>("desc");
  const [vipOnly, setVipOnly] = useState(false);
  const [bookletList, setBookletList] = useState<BookletItem[]>([]);
  const [byteCourseList, setByteCourseList] = useState<ByteCourseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const sortValue = useMemo(() => getSortValue(sortKey, priceOrder), [priceOrder, sortKey]);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const result = await fetchCategoryList();
        if (!active) {
          return;
        }
        setCategories(result);
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "分类加载失败";
        setErrorText(message);
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (courseType !== "booklet") {
      return;
    }

    let active = true;
    setLoading(true);
    setErrorText("");

    fetchBookletList({ categoryId: activeCategory, sort: sortValue, vipOnly })
      .then((result) => {
        if (!active) {
          return;
        }
        setBookletList(result);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "列表加载失败";
        setErrorText(message);
        setBookletList([]);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeCategory, courseType, sortValue, vipOnly]);

  useEffect(() => {
    if (courseType !== "byte-course") {
      return;
    }

    let active = true;
    setLoading(true);
    setErrorText("");

    fetchByteCourseList(activeCategory)
      .then((result) => {
        if (!active) {
          return;
        }
        setByteCourseList(result);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "列表加载失败";
        setErrorText(message);
        setByteCourseList([]);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeCategory, courseType]);

  const handleSortClick = (key: Exclude<SortKey, "price">) => setSortKey(key);
  const handlePriceSortClick = () => {
    setSortKey("price");
    setPriceOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <main className="min-h-screen bg-[#f4f5f5] py-6">
      <section className="mx-auto w-full max-w-[980px] rounded-lg bg-white px-5 pb-5 pt-4 shadow-sm">
        <header className="border-b border-jj-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[20px] text-jj-subtext">课程:</span>
              {COURSE_OPTIONS.map((course) => (
                <button
                  key={course.key}
                  type="button"
                  onClick={() => setCourseType(course.key)}
                  className={`course-option-btn ${course.tag ? "course-option-btn-with-tag" : ""}`}
                >
                  <span
                    className={`course-option-pill ${
                      courseType === course.key
                        ? "course-option-pill-active"
                        : "course-option-pill-inactive"
                    }`}
                  >
                    {course.label}
                  </span>
                  {course.tag ? (
                    <span className="vip-free-badge vip-free-badge-header">
                      {course.tag}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <button type="button" className="rounded p-2 hover:bg-[#f7f8fa]" aria-label="搜索">
              <SearchIcon />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-[20px] text-jj-subtext">分类:</span>
            <button
              type="button"
              onClick={() => setActiveCategory("0")}
              className={`rounded-2xl border px-3 py-1 text-[20px] ${
                activeCategory === "0"
                  ? "border-jj-blue bg-[#eaf2ff] text-jj-blue"
                  : "border-jj-border text-[#4e5969]"
              }`}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category.category_id}
                type="button"
                onClick={() => setActiveCategory(category.category_id)}
                className={`rounded-2xl border px-3 py-1 text-[20px] ${
                  activeCategory === category.category_id
                    ? "border-jj-blue bg-[#eaf2ff] text-jj-blue"
                    : "border-jj-border text-[#4e5969]"
                }`}
              >
                {category.category_name}
              </button>
            ))}
          </div>
        </header>

        <section className="mt-3">
          {courseType === "booklet" ? (
            <>
              <div className="flex flex-wrap items-center justify-between border-b border-jj-border pb-2">
                <div className="flex items-center gap-5 text-xl">
                  {SORT_OPTIONS.map((sort) => (
                    <button
                      key={sort.key}
                      type="button"
                      onClick={() => handleSortClick(sort.key)}
                      className={
                        sortKey === sort.key ? "font-semibold text-jj-blue" : "text-[#4e5969]"
                      }
                    >
                      {sort.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handlePriceSortClick}
                    className={`inline-flex items-center gap-1 ${
                      sortKey === "price" ? "font-semibold text-jj-blue" : "text-[#4e5969]"
                    }`}
                  >
                    <span>价格</span>
                    <span className="text-xs">{priceOrder === "desc" ? "↓" : "↑"}</span>
                  </button>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xl text-jj-text">
                  <input
                    className="h-4 w-4 rounded border-jj-border accent-jj-blue"
                    checked={vipOnly}
                    type="checkbox"
                    onChange={(event) => setVipOnly(event.target.checked)}
                  />
                  <span>只看VIP课程</span>
                </label>
              </div>

              {loading ? (
                <div className="py-8 text-center text-jj-subtext">正在加载课程...</div>
              ) : null}
              {!loading && errorText ? (
                <div className="py-8 text-center text-[#f53f3f]">{errorText}</div>
              ) : null}
              {!loading && !errorText && bookletList.length === 0 ? (
                <div className="py-8 text-center text-jj-subtext">该分类下暂无小册</div>
              ) : null}
              {!loading && !errorText && bookletList.length > 0 ? (
                <div>
                  {bookletList.map((item) => (
                    <BookletCard key={item.booklet_id} item={item} />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="border-b border-jj-border pb-2 text-lg text-jj-subtext">
                字节内部课为会员专享课程，以下为当前分类下课程列表。
              </div>
              {loading ? (
                <div className="py-8 text-center text-jj-subtext">正在加载课程...</div>
              ) : null}
              {!loading && errorText ? (
                <div className="py-8 text-center text-[#f53f3f]">{errorText}</div>
              ) : null}
              {!loading && !errorText && byteCourseList.length === 0 ? (
                <div className="py-8 text-center text-jj-subtext">该分类下暂无内部课</div>
              ) : null}
              {!loading && !errorText && byteCourseList.length > 0 ? (
                <div>
                  {byteCourseList.map((item) => (
                    <ByteCourseCard key={item.content.item_id} item={item} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
