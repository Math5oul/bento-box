import { Injectable, Type } from '@angular/core';
import { SimpleProductComponent } from '../../components/simpleComponents/simple-product/simple-product.component';
import { SimpleTextComponent } from '../../components/simpleComponents/simple-text/simple-text.component';
import { SimpleImageComponent } from '../../components/simpleComponents/simple-image/simple-image.component';
import { SimpleVideoComponent } from '../../components/simpleComponents/simple-video/simple-video.component';

@Injectable({
  providedIn: 'root',
})
export class ComponentRegistryService {
  private componentRegistry: { [key: string]: Type<any> } = {
    SimpleProductComponent: SimpleProductComponent,
    SimpleTextComponent: SimpleTextComponent,
    SimpleImageComponent: SimpleImageComponent,
    SimpleVideoComponent: SimpleVideoComponent,
  };

  getComponent(name: string): Type<any> | undefined {
    return this.componentRegistry[name];
  }

  /**
   * Retorna o nome string de um componente Type
   */
  getComponentName(component: Type<any>): string {
    for (const [name, comp] of Object.entries(this.componentRegistry)) {
      if (comp === component) {
        return name;
      }
    }
    return component.name || 'SimpleProductComponent';
  }
}
