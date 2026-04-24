import type { ApiResponse, BookletItem, ByteCourseItem, CategoryItem } from "./types";

const COMMON_QUERY = "aid=2608&uuid=7625915963385775622&spider=0";
const API_BASE =
  process.env.NODE_ENV === "development" ? "/juejin-api" : "https://api.juejin.cn";

const CATEGORY_ALLOW_LIST = [
  "后端",
  "前端",
  "Android",
  "iOS",
  "人工智能",
  "开发工具",
  "代码人生",
  "阅读",
] as const;

const API_HEADERS = {
  accept: "*/*",
  "content-type": "application/json",
};

const sortCategories = (left: CategoryItem, right: CategoryItem) => left.rank - right.rank;

const filterCourseCategories = (category: CategoryItem) =>
  CATEGORY_ALLOW_LIST.includes(category.category_name as (typeof CATEGORY_ALLOW_LIST)[number]);

const assertResponse = <T>(result: ApiResponse<T>): T => {
  if (result.err_no !== 0) {
    throw new Error(result.err_msg || "请求失败");
  }
  return result.data;
};

const requestJson = async <T>(url: string, init: RequestInit): Promise<ApiResponse<T>> => {
  const response = await fetch(url, init);
  const rawText = await response.text();

  let parsed: ApiResponse<T> | null = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as ApiResponse<T>;
    } catch {
      throw new Error(`接口返回非 JSON（HTTP ${response.status}）`);
    }
  }

  if (!response.ok) {
    const errorMessage = parsed?.err_msg || `HTTP ${response.status}`;
    throw new Error(`请求失败：${errorMessage}`);
  }

  if (!parsed) {
    throw new Error("接口返回为空");
  }

  return parsed;
};

export const fetchCategoryList = async (): Promise<CategoryItem[]> => {
  const json = await requestJson<CategoryItem[]>(
    `${API_BASE}/tag_api/v1/query_category_briefs?${COMMON_QUERY}`,
    {
      method: "GET",
      headers: API_HEADERS,
    },
  );
  const categories = assertResponse(json);
  return categories.filter(filterCourseCategories).sort(sortCategories);
};

export interface FetchBookletParams {
  categoryId: string;
  sort: number;
  vipOnly: boolean;
}

export const fetchBookletList = async ({
  categoryId,
  sort,
  vipOnly,
}: FetchBookletParams): Promise<BookletItem[]> => {
  const json = await requestJson<BookletItem[]>(
    `${API_BASE}/booklet_api/v1/booklet/listbycategory?${COMMON_QUERY}`,
    {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({
        category_id: categoryId,
        cursor: "0",
        sort,
        is_vip: vipOnly ? 1 : 0,
        limit: 20,
      }),
    },
  );
  return assertResponse(json);
};

export const fetchByteCourseList = async (categoryId: string): Promise<ByteCourseItem[]> => {
  const query = `category_id=${categoryId}&cursor=0&page_size=20&${COMMON_QUERY}`;
  const json = await requestJson<ByteCourseItem[]>(
    `${API_BASE}/booklet_api/v1/bytecourse/list_by_category?${query}`,
    {
      method: "GET",
      headers: API_HEADERS,
    },
  );
  return assertResponse(json);
};
