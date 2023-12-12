import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { IconX } from 'angular-tabler-icons/icons';

const icons = {
  IconX,
};

@NgModule({
  declarations: [],
  imports: [CommonModule, TablerIconsModule.pick(icons)],
  exports: [TablerIconsModule],
})
export class IconsModule {}
