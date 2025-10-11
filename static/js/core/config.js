/**
 * 配置文件 - 全局配置和常量
 */

const APP_CONFIG = {
    API_BASE_URL: '/api',
    APP_NAME: 'Schema Generator',
    VERSION: '1.0.0'
};

const FIELD_TYPES = [
    { group: '基础类型', items: [
        { value: 'String', label: 'String - 字符串' },
        { value: 'Integer', label: 'Integer - 整数' },
        { value: 'Float', label: 'Float - 浮点数' },
        { value: 'Boolean', label: 'Boolean - 布尔值' },
        { value: 'DateTime', label: 'DateTime - 日期时间' }
    ]},
    { group: '文本类型', items: [
        { value: 'TextArea', label: 'TextArea - 多行文本' },
        { value: 'Editor', label: 'Editor - 富文本编辑器' }
    ]},
    { group: '选择类型', items: [
        { value: 'Select', label: 'Select - 单选下拉' },
        { value: 'SelectMulti', label: 'SelectMulti - 多选下拉' },
        { value: 'Radio', label: 'Radio - 单选按钮' }
    ]},
    { group: '文件类型', items: [
        { value: 'File', label: 'File - 单文件上传' },
        { value: 'FileMulti', label: 'FileMulti - 多文件上传' },
        { value: 'Image', label: 'Image - 单图片上传' },
        { value: 'ImageMulti', label: 'ImageMulti - 多图片上传' }
    ]}
];

// 导出配置
window.APP_CONFIG = APP_CONFIG;
window.FIELD_TYPES = FIELD_TYPES;
