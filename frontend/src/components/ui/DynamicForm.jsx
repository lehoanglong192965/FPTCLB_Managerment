import {
  Form, Input, InputNumber, Select, DatePicker,
  Checkbox, Radio, Switch, Button, Row, Col,
} from "antd";

const { TextArea } = Input;

const VALUEPROP = { checkbox: "checked", switch: "checked" };

function FieldControl({ field }) {
  switch (field.type) {
    case "text":
      return <Input placeholder={field.placeholder} disabled={field.disabled} />;

    case "email":
      return <Input type="email" placeholder={field.placeholder} disabled={field.disabled} />;

    case "password":
      return <Input.Password placeholder={field.placeholder} disabled={field.disabled} />;

    case "number":
      return (
        <InputNumber
          style={{ width: "100%" }}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={field.disabled}
        />
      );

    case "textarea":
      return (
        <TextArea
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          disabled={field.disabled}
        />
      );

    case "select":
      return (
        <Select placeholder={field.placeholder} disabled={field.disabled} allowClear>
          {field.options?.map((opt) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const label = typeof opt === "object" ? opt.label : opt;
            return <Select.Option key={val} value={val}>{label}</Select.Option>;
          })}
        </Select>
      );

    case "date":
      return (
        <DatePicker
          style={{ width: "100%" }}
          placeholder={field.placeholder}
          format={field.format ?? "DD/MM/YYYY"}
          disabled={field.disabled}
        />
      );

    case "checkbox":
      return <Checkbox disabled={field.disabled}>{field.checkboxLabel}</Checkbox>;

    case "radio":
      return (
        <Radio.Group disabled={field.disabled}>
          {field.options?.map((opt) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const label = typeof opt === "object" ? opt.label : opt;
            return <Radio key={val} value={val}>{label}</Radio>;
          })}
        </Radio.Group>
      );

    case "switch":
      return <Switch disabled={field.disabled} />;

    default:
      return <Input placeholder={field.placeholder} />;
  }
}

/**
 * @param {object}   schema          - JSON schema mô tả form (xem bên dưới)
 * @param {function} onSubmit        - callback(values) khi submit thành công
 * @param {object}   [initialValues] - giá trị khởi tạo cho các field
 * @param {boolean}  [loading]       - trạng thái loading của nút submit
 * @param {string}   [className]     - class Tailwind bổ sung cho wrapper
 *
 * Schema shape:
 * {
 *   title?: string,
 *   submitText?: string,
 *   fields: [
 *     {
 *       type: "text"|"email"|"password"|"number"|"textarea"|"select"|"date"|"checkbox"|"radio"|"switch",
 *       name: string,           // tên field (key trong values)
 *       label: string,          // nhãn hiển thị
 *       placeholder?: string,
 *       required?: boolean,
 *       disabled?: boolean,
 *       span?: 1–24,            // độ rộng cột (24 = full width, 12 = nửa)
 *       rules?: AntD Rule[],   // validation rules bổ sung
 *       options?: string[] | { value, label }[],  // cho select / radio
 *       checkboxLabel?: string, // nhãn bên cạnh checkbox
 *       rows?: number,          // cho textarea
 *       min?: number,           // cho number
 *       max?: number,           // cho number
 *       format?: string,        // cho date, mặc định "DD/MM/YYYY"
 *     }
 *   ]
 * }
 */
export default function DynamicForm({
  schema,
  onSubmit,
  initialValues,
  loading = false,
  className = "",
}) {
  const [form] = Form.useForm();

  const buildRules = (field) => [
    ...(field.required
      ? [{ required: true, message: `${field.label} là bắt buộc` }]
      : []),
    ...(field.type === "email"
      ? [{ type: "email", message: "Email không hợp lệ" }]
      : []),
    ...(field.rules ?? []),
  ];

  return (
    <div className={className}>
      {schema.title && (
        <h2 className="text-lg font-bold text-[#0D1B3E] mb-4">{schema.title}</h2>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onSubmit}
      >
        <Row gutter={[16, 0]}>
          {schema.fields.map((field) => (
            <Col key={field.name} span={field.span ?? 24}>
              <Form.Item
                name={field.name}
                label={field.label}
                valuePropName={VALUEPROP[field.type] ?? "value"}
                rules={buildRules(field)}
              >
                <FieldControl field={field} />
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Form.Item className="mb-0 mt-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ background: "#E6430A", borderColor: "#E6430A" }}
          >
            {schema.submitText ?? "Gửi"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
