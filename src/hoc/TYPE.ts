// 这个文件包含类型定义，未使用的变量是预期的
import { ComponentType, FC } from 'react';

export type SectionWrapperType = <P>(_Component: ComponentType<P>, _idName: string) => FC;
