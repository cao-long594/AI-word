import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { getCourses } from '../api/courses';
import {
  createStudent,
  deleteStudent,
  getStudentClasses,
  getStudents,
  updateStudent,
} from '../api/students';
import type { StudentQuery } from '../api/students';
import type { Course, Student, StudentPayload } from '../types/api';
import { statusText } from '../utils/format';

const defaultQuery = { page: 1, pageSize: 10 };
const selectedCourseLimit = 18;

function truncateText(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

export default function Students() {
  const [form] = Form.useForm<StudentPayload>();
  const [queryForm] = Form.useForm();
  const [list, setList] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState<StudentQuery>(defaultQuery);

  const courseNameMap = useMemo(() => {
    return courses.reduce<Record<number, string>>((map, item) => {
      map[item.id] = item.name;
      return map;
    }, {});
  }, [courses]);

  const loadData = useCallback(async (nextQuery: StudentQuery = defaultQuery) => {
    setLoading(true);
    try {
      const data = await getStudents(nextQuery);
      setList(data.list);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadOptions() {
    const [classList, courseData] = await Promise.all([
      getStudentClasses(),
      getCourses({ page: 1, pageSize: 100 }),
    ]);
    setClasses(classList);
    setCourses(courseData.list);
  }

  useEffect(() => {
    loadData();
    loadOptions();
  }, [loadData]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', course_ids: [] });
    setModalOpen(true);
  }

  function openEdit(record: Student) {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  async function submitForm() {
    const values = await form.validateFields();
    if (editing) {
      await updateStudent(editing.id, values);
      message.success('学生已更新');
    } else {
      await createStudent(values);
      message.success('学生已新增');
    }
    setModalOpen(false);
    loadData(query);
    loadOptions();
  }

  async function handleDelete(id: number) {
    await deleteStudent(id);
    message.success('学生已删除');
    loadData(query);
  }

  function handleSearch() {
    const values = queryForm.getFieldsValue();
    const nextQuery = { ...defaultQuery, ...values };
    setQuery(nextQuery);
    loadData(nextQuery);
  }

  function handleTableChange(pagination: TablePaginationConfig) {
    const nextQuery = {
      ...query,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
    };
    setQuery(nextQuery);
    loadData(nextQuery);
  }

  const columns: ColumnsType<Student> = [
    {
      title: '姓名',
      dataIndex: 'name',
      render: (name) => (
        <div className="name-block">
          <Typography.Text className="name-primary" strong title={name}>
            {name}
          </Typography.Text>
        </div>
      ),
    },
    { title: '学号', dataIndex: 'student_no', width: 96 },
    {
      title: '班级',
      dataIndex: 'class_name',
      width: 126,
      render: (className: string) => (
        <Tag className="tag-soft-purple" title={className || '未分班'}>
          {className || '未分班'}
        </Tag>
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'phone',
      width: 230,
      render: (_, record) => (
        <div className="contact-block">
          <span className="contact-phone">{record.phone || '-'}</span>
          <span className="contact-email" title={record.email || '-'}>
            {record.email || '-'}
          </span>
        </div>
      ),
    },
    {
      title: '已选课程',
      dataIndex: 'course_ids',
      render: (ids: number[]) => {
        const courseNames = ids.length
          ? ids.map((id) => courseNameMap[id] || `课程${id}`).join('、')
          : '未选课';

        return (
          <span className="selected-course-text" title={courseNames}>
            {truncateText(courseNames, selectedCourseLimit)}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: Student['status']) => (
        <Tag className={status === 'active' ? 'tag-status-success' : 'tag-status-muted'}>
          {statusText(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space className="table-actions" size={8}>
          <Button className="action-link action-edit" type="link" size="small" onClick={() => openEdit(record)}>
            ✏️ 编辑
          </Button>
          <Popconfirm title="确定删除这个学生吗？" onConfirm={() => handleDelete(record.id)}>
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
      <h1 className="page-title">学生管理</h1>
      <Card className="sketch-table-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-[18px]">
          <Form form={queryForm} layout="inline" className="flex flex-wrap items-center gap-2.5">
            <Form.Item name="keyword">
              <Input
                name="keyword"
                allowClear
                autoComplete="off"
                placeholder="搜索姓名 / 学号…"
                prefix={<SearchOutlined aria-hidden="true" />}
              />
            </Form.Item>
            <Form.Item name="className">
              <Select
                allowClear
                placeholder="全部班级"
                style={{ width: 120 }}
                popupMatchSelectWidth={false}
                options={classes.map((item) => ({ label: item, value: item }))}
              />
            </Form.Item>
            <Form.Item name="status">
              <Select
                allowClear
                placeholder="全部状态"
                style={{ width: 120 }}
                popupMatchSelectWidth={false}
                options={[
                  { label: '活跃', value: 'active' },
                  { label: '非活跃', value: 'inactive' },
                ]}
              />
            </Form.Item>
            <Button type="default" icon={<SearchOutlined aria-hidden="true" />} onClick={handleSearch}>
              搜索
            </Button>
          </Form>
          <Button type="primary" icon={<PlusOutlined aria-hidden="true" />} onClick={openCreate}>
            新增学生
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          onChange={handleTableChange}
          scroll={{ x: 980 }}
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
        title={editing ? '编辑学生' : '新增学生'}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="compact-form-grid">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input name="name" autoComplete="name" placeholder="请输入姓名…" />
          </Form.Item>
          <Form.Item name="student_no" label="学号" rules={[{ required: true, message: '请输入学号' }]}>
            <Input name="student_no" autoComplete="off" spellCheck={false} placeholder="请输入学号…" />
          </Form.Item>
          <Form.Item name="class_name" label="班级">
            <Input name="class_name" autoComplete="off" placeholder="请输入班级…" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { label: '活跃', value: 'active' },
                { label: '非活跃', value: 'inactive' },
              ]}
            />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="请输入手机号…" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input name="email" type="email" autoComplete="email" spellCheck={false} placeholder="请输入邮箱…" />
          </Form.Item>
          <Form.Item className="form-span-2" name="course_ids" label="选择课程">
            <Checkbox.Group
              className="course-checkbox-group"
              options={courses.map((item) => ({ label: item.name, value: item.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
