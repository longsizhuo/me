// 这个文件包含类型定义，未使用的变量是预期的
import { ComponentType, FC } from 'react';

// Not generic: every call site (About, Experience, ContactAdvanced, ...) wraps
// a zero-props component. A generic <P> made the HOC body itself unprovable
// (rendering <Component /> requires {} to satisfy an unconstrained P), which
// is a real type hole, not a false positive — constraining to no props is the
// honest fix, not a workaround.
export type SectionWrapperType = (
  _Component: ComponentType<Record<string, never>>,
  _idName: string,
) => FC;
