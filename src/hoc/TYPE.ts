/* eslint-disable no-unused-vars */
import { ComponentType, FC } from 'react';

export type SectionWrapperType = <P>(_Component: ComponentType<P>, _idName: string) => FC;
