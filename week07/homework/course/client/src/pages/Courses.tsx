import { useCallback, useEffect, useState } from 'react';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig, SorterResult } from 'antd/es/table/interface';
import {
  createCourse,
  deleteCourse,
  getCourseCategories,
  getCourses,
  toggleCourseStatus,
  updateCourse,
} from '../api/courses';
import type { CourseQuery } from '../api/courses';
import type { Course, CoursePayload } from '../types/api';
import { statusText } from '../utils/format';

const defaultQuery = { page: 1, pageSize: 10 };
const courseDescriptionLimit = 13;

function truncateText(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

export default function Courses() {
  const [form] = Form.useForm<CoursePayload>();
  const [queryForm] = Form.useForm();
  const [list, setList] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState<CourseQuery>(defaultQuery);

  const loadData = useCallback(async (nextQuery: CourseQuery = defaultQuery) => {
    setLoading(true);
    try {
      const data = await getCourses(nextQuery);
      setList(data.list);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadCategories() {
    const data = await getCourseCategories();
    setCategories(data);
  }

  useEffect(() => {
    loadData();
    loadCategories();
  }, [loadData]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'draft', lesson_count: 0 });
    setModalOpen(true);
  }

  function openEdit(record: Course) {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  async function submitForm() {
    const values = await form.validateFields();
    if (editing) {
      await updateCourse(editing.id, values);
      message.success('课程已更新');
    } else {
      await createCourse(values);
      message.success('课程已新增');
    }
    setModalOpen(false);
    loadData(query);
    loadCategories();
  }

  async function handleDelete(id: number) {
    await deleteCourse(id);
    message.success('课程已删除');
    loadData(query);
    loadCategories();
  }

  async function handleToggle(id: number) {
    await toggleCourseStatus(id);
    message.success('状态已更新');
    loadData(query);
  }

  function handleSearch() {
    const values = queryForm.getFieldsValue();
    const nextQuery = { ...defaultQuery, ...values };
    setQuery(nextQuery);
    loadData(nextQuery);
  }

  function handleTableChange(pagination: TablePaginationConfig, _: unknown, sorter: SorterResult<Course> | SorterResult<Course>[]) {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextQuery = {
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
      sortField: activeSorter?.order ? String(activeSorter.field || '') : '',
      sortOrder: activeSorter?.order || undefined,
    };
    setQuery(nextQuery);
    loadData(nextQuery);
  }

  const columns: ColumnsType<Course> = [
    {
      title: '课程信息',
      dataIndex: 'name',
      render: (_, record) => (
        <div className="name-block">
          <Typography.Text className="name-primary" strong title={record.name}>
            {record.name}
          </Typography.Text>
          <span className="name-secondary" title={record.description || '暂无描述'}>
            {truncateText(record.description || '暂无描述', courseDescriptionLimit)}
          </span>
        </div>
      ),
    },
    { title: '讲师', dataIndex: 'instructor', width: 88 },
    {
      title: '分类',
      dataIndex: 'category',
      width: 104,
      render: (category: string) => (
        <Tag className="tag-soft-blue" title={category || '未分类'}>
          {category || '未分类'}
        </Tag>
      ),
    },
    { title: '课时', dataIndex: 'lesson_count', width: 80 },
    {
      title: '学生数',
      dataIndex: 'student_count',
      width: 100,
      sorter: true,
      sortOrder: query.sortField === 'student_count' ? query.sortOrder as 'ascend' | 'descend' : null,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: Course['status']) => (
        <Tag className={status === 'published' ? 'tag-status-success' : 'tag-status-muted'}>
          {statusText(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 220,
      render: (_, record) => (
        <Space className="table-actions" size={8}>
          <Button className="action-link action-edit" type="link" size="small" onClick={() => openEdit(record)}>
            ✏️ 编辑
          </Button>
          <Button
            className="action-link action-muted"
            type="link"
            size="small"
            onClick={() => handleToggle(record.id)}
          >
            {record.status === 'published' ? '下架' : '发布'}
          </Button>
          <Popconfirm title="确定删除这门课程吗？" onConfirm={() => handleDelete(record.id)}>
            <Button className="action-link action-delete" type="link" size="small" danger>
              🗑 删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <h1 className="page-title">课程管理</h1>
      <Card className="sketch-table-card">
        <div className="toolbar">
          <Form form={queryForm} layout="inline" className="toolbar-left">
            <Form.Item name="keyword">
              <Input
                name="keyword"
                allowClear
                autoComplete="off"
                placeholder="搜索课程名 / 讲师…"
                prefix={<SearchOutlined aria-hidden="true" />}
              />
            </Form.Item>
            <Form.Item name="status">
              <Select
                allowClear
                placeholder="全部状态"
                style={{ width: 120 }}
                popupMatchSelectWidth={false}
                options={[
                  { label: '已发布', value: 'published' },
                  { label: '草稿', value: 'draft' },
                ]}
              />
            </Form.Item>
            <Form.Item name="category">
              <Select
                allowClear
                placeholder="全部分类"
                style={{ width: 120 }}
                popupMatchSelectWidth={false}
                options={categories.map((item) => ({ label: item, value: item }))}
              />
            </Form.Item>
            <Button type="default" icon={<SearchOutlined aria-hidden="true" />} onClick={handleSearch}>
              搜索
            </Button>
          </Form>
          <Button type="primary" icon={<PlusOutlined aria-hidden="true" />} onClick={openCreate}>
            新增课程
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          onChange={handleTableChange}
          scroll={{ x: 900 }}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 15],
          }}
        />
      </Card>

      <Modal
        className="sketch-modal"
        title={editing ? '编辑课程' : '新增课程'}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="compact-form-grid">
          <Form.Item
            className="form-span-2"
            name="name"
            label="课程名称"
            rules={[{ required: true, message: '请输入课程名称' }]}
          >
            <Input name="name" autoComplete="off" placeholder="请输入课程名称…" />
          </Form.Item>
          <Form.Item className="form-span-2" name="description" label="课程描述">
            <Input.TextArea name="description" rows={2} autoComplete="off" placeholder="请输入课程描述…" />
          </Form.Item>
          <Form.Item name="instructor" label="讲师">
            <Input name="instructor" autoComplete="off" placeholder="请输入讲师…" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select
              allowClear
              placeholder="请选择分类…"
              popupMatchSelectWidth={false}
              options={categories.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
          <Form.Item name="lesson_count" label="课时数">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { label: '已发布', value: 'published' },
                { label: '草稿', value: 'draft' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
