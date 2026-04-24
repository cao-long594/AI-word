export interface CategoryItem {
  category_id: string;
  category_name: string;
  category_url: string;
  rank: number;
}

export interface BookletBaseInfo {
  booklet_id: string;
  title: string;
  summary: string;
  cover_img: string;
  category_id: string;
  price: number;
  buy_count: number;
  put_on_time: number;
  can_vip_borrow?: boolean;
}

export interface BookletUserInfo {
  user_name: string;
  avatar_large: string;
  level: number;
  job_title: string;
  company: string;
}

export interface BookletDiscountInfo {
  name: string;
  pay_money: number;
  price: number;
}

export interface BookletEventDiscountInfo {
  show_label: string;
}

export interface BookletItem {
  booklet_id: string;
  base_info: BookletBaseInfo;
  user_info: BookletUserInfo;
  max_discount?: BookletDiscountInfo;
  event_discount?: BookletEventDiscountInfo;
  section_updated_count: number;
  is_new: boolean;
}

export interface ApiResponse<T> {
  err_no: number;
  err_msg: string;
  data: T;
}

export interface ByteCourseCoverImage {
  url: string;
}

export interface ByteCoursePackage {
  producer: string;
  duration: number;
  chapter_count: number;
}

export interface ByteCourseExtra {
  course_package?: ByteCoursePackage;
}

export interface ByteCourseContent {
  item_id: string;
  name: string;
  abstract: string;
  publish_time: number;
  cover_image: ByteCourseCoverImage;
  extra?: ByteCourseExtra;
}

export interface ByteCourseCategoryRef {
  category_id: string;
  name: string;
}

export interface ByteCourseTagRef {
  tag_id: string;
  name: string;
}

export interface ByteCourseItem {
  content: ByteCourseContent;
  categories: ByteCourseCategoryRef[];
  tags: ByteCourseTagRef[];
}
