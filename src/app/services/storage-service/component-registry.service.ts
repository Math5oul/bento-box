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
   * Obtém o nome da string a partir do componente Type
   */
  getComponentName(component: Type<any>): string {
    // Procura no registry pelo componente
    for (const [name, comp] of Object.entries(this.componentRegistry)) {
      if (comp === component) {
        return name;
      }
    }
    // Fallback: retorna o nome do construtor
    return component.name || 'SimpleProductComponent';
  }
}
