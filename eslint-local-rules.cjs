module.exports = {

  'forbid-explicit-css': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm sử dụng thuộc tính style (explicit CSS) nội tuyến.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      const ALLOWED_DIRS = [
        'src/components/ui/',
        'src/components/editor/',
        'src/components/tasks/',
        'src/constants/',
        'src/utils/',
      ];
      return {
        JSXAttribute(node) {
          if (node.name.name === 'style') {
            const filename = context.getFilename().replace(/\\/g, '/');
            if (ALLOWED_DIRS.some(d => filename.includes(d))) return;
            context.report({
              node,
              message: '[Quy Tắc Mới] Vi phạm Explicit CSS: Tuyệt đối không dùng thuộc tính style nội tuyến. Vui lòng sử dụng Tailwind Classes hoặc khai báo token/variant mới.'
            });
          }
        }
      };
    }
  },
  'forbid-eslint-disable': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm sử dụng comment vô hiệu hoá eslint trừ khi có từ khoá ALLOW_DISABLE.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      return {
        Program() {
          const sourceCode = context.getSourceCode();
          const comments = sourceCode.getAllComments();
          comments.forEach(comment => {
            const value = comment.value.trim();
            if (value.startsWith('eslint-disable')) {
              if (value.includes('max-lines')) {
                return; // Allowed
              } else {
                context.report({
                  loc: comment.loc,
                  message: '[Quy Tắc Mới] Vi phạm: Không được phép dùng eslint-disable để vô hiệu hoá rule (ngoại trừ max-lines).'
                });
              }
            }
          });
        }
      };
    }
  },
  'forbid-primitive-jsx-props': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm truyền trực tiếp các giá trị số tĩnh vào JSX Props. Phải dùng Constants hoặc Semantic Variants.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      return {
        JSXAttribute(node) {
          const filename = context.getFilename().replace(/\\/g, '/');
          
          // Ngoại lệ: Cho phép viết số cứng ở UI kit, utils hoặc constants
          if (filename.includes('src/components/ui/') || filename.includes('src/constants/') || filename.includes('src/utils/')) {
            return;
          }

          // Các thuộc tính HTML/React cơ bản được phép nhận số
          const allowedProps = [
            // HTML / React core
            'key', 'tabIndex', 'rows', 'cols', 'maxLength', 'minLength',
            'step', 'max', 'min', 'value', 'defaultValue',
            'colSpan', 'rowSpan', 'span',
            // SVG geometry attributes (nhận số theo SVG spec, không có component thay thế)
            'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
            'strokeWidth', 'strokeDasharray', 'strokeDashoffset',
            'viewBox', 'rotate', 'scale', 'translate',
            'offset', 'fx', 'fy', 'points',
            // Radix UI / Floating UI props (number by API contract)
            'delayDuration', 'skipDelayDuration',
            'sideOffset', 'alignOffset', 'arrowPadding', 'collisionPadding',
            // Typography / layout naturally numeric
            'lineClamp', 'numberOfLines', 'level',
            // Animation / timing (ms values)
            'duration', 'delay', 'repeatCount', 'repeatDelay',
          ];

          // Các layout prop bị cấm truyền số nguyên — phải dùng string variant
          const layoutPropsRequireString = ['flex', 'shrink', 'grow', 'order'];

          const propName = node.name.name;
          if (allowedProps.includes(propName)) return;

          if (
            node.value &&
            node.value.type === 'JSXExpressionContainer' &&
            node.value.expression.type === 'Literal' &&
            typeof node.value.expression.value === 'number'
          ) {
            const val = node.value.expression.value;

            if (layoutPropsRequireString.includes(propName)) {
              context.report({
                node: node.value,
                message: `[Quy Tắc Layout] Prop '${propName}={${val}}' phải truyền dưới dạng string variant: ${propName}="${val}". Không dùng số nguyên cho layout props.`
              });
            } else {
              context.report({
                node: node.value,
                message: `[Quy Tắc Mới] Vi phạm Thuộc Tính Tĩnh: Không truyền trực tiếp số nguyên (${val}) vào prop '${propName}'. Hãy sử dụng Constants (vd: UI_CONSTANTS.TOOLTIP_DELAY) hoặc Semantic Variants (vd: ${propName}="${val}").`
              });
            }
          }
        }
      };
    }
  },

  // ─── Rule mới 1: Cấm thẻ HTML native phổ biến trong JSX ────────────────────
  'forbid-native-jsx-elements': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm dùng thẻ HTML native trong JSX. Phải dùng Component từ @/components/ui/.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      const FORBIDDEN_ELEMENTS = new Set([
        'div',         // ← dùng <Box> thay thế
        'button', 'input', 'textarea', 'select', 'option',
        'a', 'img', 'video', 'audio',
        'label', 'form', 'fieldset',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span', 'b', 'i', 'strong', 'em',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
        'hr', 'br',
        'nav', 'header', 'footer', 'aside', 'article', 'section', 'main',
      ]);

      // Ngoại lệ: UI kit được phép dùng thẻ native để wrap
      const ALLOWED_DIRS = [
        'src/components/ui/',
        'src/constants/',
        'src/utils/',
      ];

      return {
        JSXOpeningElement(node) {
          const filename = context.getFilename().replace(/\\/g, '/');
          if (ALLOWED_DIRS.some(d => filename.includes(d))) return;

          if (
            node.name.type === 'JSXIdentifier' &&
            FORBIDDEN_ELEMENTS.has(node.name.name)
          ) {
            const tag = node.name.name;
            const suggestions = {
              div: '<Box>, <Flex>, <Card>, hoặc <ScrollArea>',
              button: '<Button>, <ActionArea>, hoặc <DropdownMenuTrigger>',
              input: '<Input> hoặc <TransparentInput>',
              textarea: '<Textarea> hoặc <TransparentTextarea>',
              label: '<Label> hoặc <Text as="label">',
              a: '<Button variant="link"> hoặc <ActionArea>',
              img: '<AppImage> hoặc <Avatar>',
              span: '<Text as="span">',
              p: '<Text as="p">',
              h1: '<Text as="h1">',
              h2: '<Text as="h2">',
              h3: '<Text as="h3">',
              ul: '<Box as="ul">',
              li: '<Box as="li">',
            };
            const hint = suggestions[tag] ? ` → Gợi ý chuẩn ReUI: ${suggestions[tag]}` : ' → Phải dùng Component từ hệ sinh thái @/components/ui/ (ReUI).';
            context.report({
              node,
              message: `[Quy Tắc UI] Thẻ native <${tag}> bị cấm trong code ứng dụng.${hint}`
            });
          }
        }
      };
    }
  },

  // ─── Rule mới 2: Cấm querySelector/querySelectorAll với selector native ──────
  'forbid-native-dom-query': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm dùng querySelector/querySelectorAll với selector thẻ HTML native. Dùng data-slot hoặc data-* attribute thay thế.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      const NATIVE_TAGS = ['button', 'input', 'a', 'label', 'select', 'textarea', 'form', 'img', 'span', 'p'];
      const QUERY_METHODS = ['querySelector', 'querySelectorAll', 'getElementsByTagName'];

      return {
        CallExpression(node) {
          const methodName = node.callee.property?.name;
          if (!QUERY_METHODS.includes(methodName)) return;

          const arg = node.arguments[0];
          if (!arg || arg.type !== 'Literal' || typeof arg.value !== 'string') return;

          const selector = arg.value.trim();
          // Kiểm tra nếu selector bắt đầu bằng tên thẻ native (không có prefix # hay .)
          const firstToken = selector.split(/[\s,>\+~\[:]/, 1)[0].toLowerCase();
          if (NATIVE_TAGS.includes(firstToken)) {
            context.report({
              node,
              message: `[Quy Tắc DOM] Không dùng ${methodName}('${selector}') với selector thẻ native. Dùng data-slot="..." hoặc data-testid="..." để truy vấn DOM an toàn và ổn định hơn.`
            });
          }
        }
      };
    }
  },

  // ─── Rule mới 3: Bắt buộc trạng thái tương tác của Button ────────────────────
  'enforce-button-interactive-states': {
    meta: {
      type: 'problem',
      fixable: 'code',
      docs: {
        description: 'Đảm bảo tất cả các dạng button đều có hiệu ứng hover, press (active) và trạng thái mở (data-[state=open]) nếu là Trigger.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      function checkClassName(node, classNameValue, isTrigger) {
        if (!classNameValue || typeof classNameValue !== 'string') return;
        
        // Bỏ qua nếu className quá đơn giản hoặc không phải là tuỳ biến background/color
        if (!classNameValue.includes('bg-') && !classNameValue.includes('hover:')) return;
        
        const hasHover = classNameValue.includes('hover:');
        const hasActive = classNameValue.includes('active:');
        const hasDataState = classNameValue.includes('data-[state=open]:');
        
        const missing = [];
        if (!hasHover) missing.push('hover:');
        if (!hasActive) missing.push('active:');
        if (isTrigger && !hasDataState) missing.push('data-[state=open]:');
        
        if (missing.length > 0) {
          context.report({
            node,
            message: `[Quy Tắc Button] Các phần tử tương tác hoặc Trigger cần có đủ các class trạng thái. Thiếu: ${missing.join(', ')}. Hãy thêm hiệu ứng hover, press (active), và trạng thái mở (data-[state=open]) cho button.`,
            fix(fixer) {
              const toAdd = [];
              if (!hasHover) toAdd.push('hover:bg-accent');
              if (!hasActive) toAdd.push('active:scale-95');
              if (isTrigger && !hasDataState) {
                toAdd.push('data-[state=open]:bg-accent');
                toAdd.push('data-[state=open]:text-accent-foreground');
              }
              if (node.value && node.value.type === 'Literal') {
                const oldClasses = node.value.value;
                const newClasses = oldClasses.trim() + ' ' + toAdd.join(' ');
                return fixer.replaceText(node.value, `"${newClasses}"`);
              } else if (node.value && node.value.type === 'JSXExpressionContainer' && node.value.expression.type === 'Literal') {
                const oldClasses = node.value.expression.value;
                const newClasses = oldClasses.trim() + ' ' + toAdd.join(' ');
                return fixer.replaceText(node.value.expression, `"${newClasses}"`);
              } else if (node.value && node.value.type === 'JSXExpressionContainer' && node.value.expression.type === 'TemplateLiteral') {
                // Not automatically fixing TemplateLiterals to avoid breaking syntax
                return null;
              } else if (node.value && node.value.type === 'JSXExpressionContainer' && node.value.expression.type === 'CallExpression' && node.value.expression.callee.name === 'cn') {
                // If it's cn('...', ...) we can't easily auto-fix without babel, but we can try to inject into the first string arg if it's literal
                const args = node.value.expression.arguments;
                if (args.length > 0 && args[0].type === 'Literal') {
                  const oldClasses = args[0].value;
                  const newClasses = oldClasses.trim() + ' ' + toAdd.join(' ');
                  return fixer.replaceText(args[0], `"${newClasses}"`);
                }
              }
              return null;
            }
          });
        }
      }

      function extractStringFromAttribute(attr) {
        if (!attr || !attr.value) return null;
        if (attr.value.type === 'Literal') return attr.value.value;
        if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'Literal') {
          return attr.value.expression.value;
        }
        if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type === 'TemplateLiteral') {
          return attr.value.expression.quasis.map(q => q.value.raw).join(' ');
        }
        return null;
      }

      return {
        JSXOpeningElement(node) {
          const elementName = node.name.name || (node.name.property && node.name.property.name);
          if (!elementName) return;

          const isTrigger = elementName.endsWith('Trigger');
          let isButton = elementName === 'Button' || elementName === 'ActionArea' || isTrigger;
          
          let classNameAttr = null;
          let hasOnClick = false;
          let isAsButton = false;

          for (const attr of node.attributes) {
            if (attr.type !== 'JSXAttribute') continue;
            if (attr.name.name === 'className') classNameAttr = attr;
            if (attr.name.name === 'onClick' || attr.name.name === 'onMouseDown' || attr.name.name === 'onPointerDown') hasOnClick = true;
            if (attr.name.name === 'as' && attr.value?.value === 'button') isAsButton = true;
            if (attr.name.name === 'role' && attr.value?.value === 'button') isAsButton = true;
          }

          if (isButton || hasOnClick || isAsButton) {
            if (classNameAttr) {
              const classNameStr = extractStringFromAttribute(classNameAttr);
              if (classNameStr) {
                 checkClassName(classNameAttr, classNameStr, isTrigger);
              }
            }
          }
        }
      };
    }
  },

  // ─── Rule mới 4: Cấm setTimeout với delay số cứng (magic number) ────────────
  'forbid-magic-timeout': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm setTimeout/setInterval với delay số cứng. Phải khai báo constant có tên gợi tả trong src/constants/.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      const filename = context.getFilename().replace(/\\/g, '/');

      return {
        CallExpression(node) {
          if (!['setTimeout', 'setInterval'].includes(node.callee.name)) return;

          // Ngoại lệ: trong constants/ hoặc utils/
          if (filename.includes('src/constants/') || filename.includes('src/utils/')) return;

          const delayArg = node.arguments[1];
          if (
            delayArg &&
            delayArg.type === 'Literal' &&
            typeof delayArg.value === 'number'
          ) {
            context.report({
              node: delayArg,
              message: `[Quy Tắc Constant] setTimeout/setInterval với delay cứng (${delayArg.value}ms) vi phạm quy tắc. Khai báo constant có tên ngữ nghĩa trong src/constants/ (vd: SCROLL_DEBOUNCE_MS = ${delayArg.value}).`
            });
          }
        }
      };
    }
  },

  // ─── Rule mới 4: Cấm dùng prop `as` với giá trị là tên thẻ native ───────────
  'forbid-native-as-prop': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm lách luật bằng cách truyền tên thẻ tương tác native vào prop `as`. Phải dùng Component chuyên biệt.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      // Chỉ cấm các thẻ TƯƠNG TÁC có Component riêng trong UI kit.
      // Các thẻ semantic như: 'form', 'a', 'nav', 'section', 'header', 'main', 'aside',
      // 'h1'-'h6', 'p', 'span', 'label', 'ul', 'li', 'article'... vẫn được phép
      // dùng qua as= vì chúng không có Component thay thế tương đương trong UI kit.
      const FORBIDDEN_AS_VALUES = new Set([
        'button',    // → <Button> hoặc <ActionArea>
        'input',     // → <Input> hoặc <TransparentInput>
        'textarea',  // → <Textarea> hoặc <TransparentTextarea>
        'select',    // → <Select> từ @/components/ui/select
      ]);

      const ALLOWED_DIRS = [
        'src/components/ui/',
        'src/constants/',
        'src/utils/',
      ];

      return {
        JSXAttribute(node) {
          if (node.name.name !== 'as') return;

          const filename = context.getFilename().replace(/\\/g, '/');
          if (ALLOWED_DIRS.some(d => filename.includes(d))) return;

          // Kiểm tra nếu as="native-tag" (string literal)
          const value =
            node.value?.type === 'Literal' ? node.value.value :
            node.value?.type === 'JSXExpressionContainer' && node.value.expression.type === 'Literal'
              ? node.value.expression.value
              : null;

          if (typeof value === 'string' && FORBIDDEN_AS_VALUES.has(value)) {
            const suggestions = {
              button: '<Button> hoặc <ActionArea>',
              input: '<Input> hoặc <TransparentInput>',
              textarea: '<Textarea> hoặc <TransparentTextarea>',
              select: '<Select> từ @/components/ui/select',
            };
            context.report({
              node,
              message: `[Quy Tắc UI] as="${value}" bị cấm — đã có Component chuyên biệt. Dùng: ${suggestions[value]}.`
            });
          }
        }
      };
    }
  },

  // ─── Rule mới 5: Cấm lặp cùng điều kiện ternary trong 1 JSX element ─────────
  'forbid-repeated-jsx-ternary': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Cảnh báo khi cùng một biểu thức điều kiện ternary lặp lại ≥2 lần trong cùng một JSX element. Nên extract ra biến.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      const ALLOWED_DIRS = ['src/components/ui/', 'src/constants/', 'src/utils/'];

      // Lấy source text của phần test (vế trái) của ternary
      function getTestSource(node) {
        return context.getSourceCode().getText(node.test);
      }

      return {
        JSXOpeningElement(node) {
          const filename = context.getFilename().replace(/\\/g, '/');
          if (ALLOWED_DIRS.some(d => filename.includes(d))) return;

          // Thu thập tất cả biểu thức ternary trong các JSX attributes của element này
          const ternaryConditions = [];

          for (const attr of node.attributes) {
            if (attr.type !== 'JSXAttribute') continue;
            const val = attr.value;
            if (
              val?.type === 'JSXExpressionContainer' &&
              val.expression.type === 'ConditionalExpression'
            ) {
              const testNode = val.expression.test;
              // Bỏ qua nếu điều kiện đã là một biến đơn (Identifier) — đã được extract rồi
              if (testNode.type === 'Identifier') continue;
              // Bỏ qua nếu là phủ định của một biến đơn (UnaryExpression: !isX)
              if (testNode.type === 'UnaryExpression' && testNode.operator === '!' && testNode.argument.type === 'Identifier') continue;
              ternaryConditions.push(getTestSource(val.expression));
            }
          }

          // Đếm số lần xuất hiện của mỗi condition
          const counts = {};
          for (const cond of ternaryConditions) {
            counts[cond] = (counts[cond] || 0) + 1;
          }

          for (const [cond, count] of Object.entries(counts)) {
            if (count >= 2) {
              context.report({
                node,
                message: `[Quy Tắc DRY] Điều kiện \`${cond}\` lặp lại ${count} lần trong cùng 1 JSX element. Hãy extract thành biến: const isSelected = ${cond};`
              });
            }
          }
        }
      };
    }
  },

  // ─── Rule mới: Cấm định nghĩa SVG component trực tiếp trong feature files ─────
  'forbid-inline-svg-component': {
    meta: {
      type: 'suggestion',
      docs: {
        description:
          'Cảnh báo khi một React component trả về JSX chứa thẻ <svg> được định nghĩa trực tiếp trong feature/component file. ' +
          'Hãy chuyển SVG component vào src/assets/svg/ hoặc src/components/icons/ để quản lý tập trung.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      const filename = context.getFilename().replace(/\\/g, '/');

      // Chỉ cho phép SVG inline trong các thư mục được chỉ định
      const ALLOWED_DIRS = [
        'src/assets/svg/',
        'src/assets/icons/',
        'src/components/icons/',
        'src/components/ui/',
      ];

      if (ALLOWED_DIRS.some((d) => filename.includes(d))) return {};

      // Theo dõi các arrow function / function declaration trả về JSX
      const svgComponentsInScope = new Map();

      return {
        // Phát hiện: const XxxIcon = () => (<svg>...</svg>) hoặc (<Box asChild><svg>)
        VariableDeclarator(node) {
          if (
            node.id?.type !== 'Identifier' ||
            !node.init
          ) return;

          const init = node.init;
          const isArrowFn =
            init.type === 'ArrowFunctionExpression' ||
            init.type === 'FunctionExpression';

          if (!isArrowFn) return;

          // Lưu vào map để kiểm tra khi JSXElement được render
          svgComponentsInScope.set(node.id.name, node);
        },

        JSXOpeningElement(node) {
          const name = node.name?.name;
          if (name !== 'svg') return;

          // Lấy parent để biết SVG này nằm trong function component nào
          // Chỉ báo lỗi nếu SVG là ROOT của một component function
          const ancestors = context.getAncestors();

          // Kiểm tra xem SVG có nằm trong VariableDeclarator (const X = () => <svg>)
          const varDeclarator = ancestors.find(
            (a) => a.type === 'VariableDeclarator' && svgComponentsInScope.has(a.id?.name)
          );

          if (varDeclarator) {
            context.report({
              node,
              message:
                `[Quy Tắc SVG] Component '${varDeclarator.id.name}' chứa <svg> inline bị cấm trong feature files. ` +
                `Hãy chuyển vào src/assets/svg/ hoặc src/components/icons/ và import vào.`,
            });
          }
        },
      };
    },
  },

  // ─── Rule Architecture: Cấm import trực tiếp vào internals của feature khác ──
  // Mỗi feature phải expose API qua barrel file index.ts
  // File bên trong feature A KHÔNG được import thẳng vào sub-paths của feature B
  'forbid-cross-feature-import': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Cấm import trực tiếp vào internal sub-paths của một feature khác. ' +
          "Chỉ được phép import qua barrel file: '@/features/<name>' hoặc '@/features/<name>/index'.",
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      const filename = context.getFilename().replace(/\\/g, '/');

      // Tìm feature hiện tại của file đang được lint
      const currentFeatureMatch = filename.match(/\/src\/features\/([^/]+)\//);
      const currentFeature = currentFeatureMatch ? currentFeatureMatch[1] : null;

      // Ngoại lệ: các thư mục không bị ràng buộc bởi rule này
      const EXCLUDED_DIRS = [
        'src/components/ui/',
        'src/constants/',
        'src/utils/',
        'src/lib/',
        'src/hooks/',
        'src/types/',
        'src/stores/',
        'src/api/',
      ];

      if (EXCLUDED_DIRS.some((d) => filename.includes(d))) return {};

      return {
        ImportDeclaration(node) {
          const source = node.source.value;

          // Chỉ xét import từ @/features/
          const importMatch = source.match(/^@\/features\/([^/]+)(\/.*)?$/);
          if (!importMatch) return;

          const importedFeature = importMatch[1];
          const importedSubPath = importMatch[2]; // Phần sau tên feature, VD: "/components/Editor"

          // Cho phép import từ chính feature hiện tại
          if (importedFeature === currentFeature) return;

          // Cho phép import barrel (không có sub-path, hoặc chỉ là /index)
          if (!importedSubPath || importedSubPath === '/index') return;

          context.report({
            node,
            message:
              `[Quy Tắc Architecture] Import trực tiếp vào internals của feature '${importedFeature}' bị cấm. ` +
              `Chỉ được import qua barrel file: '@/features/${importedFeature}'. ` +
              `Nếu chưa có barrel file, hãy tạo 'src/features/${importedFeature}/index.ts' và export từ đó.`,
          });
        },
      };
    },
  },
  'strict-tailwind-spacing-radius': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Kiểm soát chặt chẽ spacing và radius. Không dùng số lẻ ngoài 0.5 và 1.5. Cấm raw CSS/arbitrary.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return;

          const checkString = (str, strNode) => {
            const classes = str.split(/\s+/);
            for (const cls of classes) {
              if (!cls) continue;
              
              const isVariant = cls.includes(']:');
              const cleanCls = cls.replace(/^(?:[a-zA-Z0-9_\[\]=&-]+:)+/, '').replace(/^-/, '');

              if (cleanCls.includes('[') && cleanCls.includes(']')) {
                context.report({
                  node: strNode,
                  message: `[Raw CSS] Không sử dụng arbitrary values (vd: '${cls}'). Hãy sử dụng class tiêu chuẩn.`
                });
                continue;
              }

              // Spacing check
              const spacingPrefixes = /^((p|m|gap|w|h|size|top|bottom|left|right|inset|space)(-[trblxy])?-)(.*)$/;
              const spacingMatch = cleanCls.match(spacingPrefixes);
              if (spacingMatch) {
                const suffix = spacingMatch[4];
                if (/^\d+(\.\d+)?$/.test(suffix)) {
                  if (suffix.includes('.') && suffix !== '0.5' && suffix !== '1.5') {
                    context.report({
                      node: strNode,
                      message: `[Spacing] Lớp '${cls}' không hợp lệ. Chỉ được dùng số lẻ 0.5 và 1.5.`
                    });
                  }
                }
              }

              // Radius check
              const radiusPrefixes = /^rounded(-[trblxy]|-tl|-tr|-bl|-br)?(-(.*))?$/;
              const radiusMatch = cleanCls.match(radiusPrefixes);
              if (radiusMatch) {
                const suffix = radiusMatch[3];
                const allowedRadius = ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];
                if (suffix && !allowedRadius.includes(suffix)) {
                  context.report({
                    node: strNode,
                    message: `[Radius] Lớp '${cls}' không hợp lệ. Hãy dùng Tailwind mặc định (sm, md, lg, xl, 2xl, 3xl, full, none).`
                  });
                }
              }
            }
          };

          if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
            checkString(node.value.value, node.value);
          } else if (node.value && node.value.type === 'JSXExpressionContainer') {
            const sourceCode = context.getSourceCode().getText(node.value);
            const stringRegex = /"([^"]+)"|'([^']+)'|`([^`]+)`/g;
            let match;
            while ((match = stringRegex.exec(sourceCode)) !== null) {
              const str = match[1] || match[2] || match[3];
              if (str) checkString(str, node.value);
            }
          }
        }
      };
    }
  },

  'strict-tailwind-tokens': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Kiểm soát chặt chẽ spacing, radius, color, typo (chỉ cho phép các token đã định nghĩa trong Design System).',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return;

          const checkString = (str, strNode) => {
            const classes = str.split(/\s+/);
            for (const cls of classes) {
              if (!cls) continue;
              
              const isNegative = cls.startsWith('-');
              const cleanCls = cls.replace(/^(?:[a-zA-Z0-9_\[\]=&-]+:)+/, '').replace(/^-/, '').replace(/['"}]+$/, '');
              
              if (cleanCls.includes('[') && cleanCls.includes(']')) {
                context.report({
                  node: strNode,
                  message: `[Raw CSS] Không sử dụng arbitrary values (vd: '${cls}'). Hãy sử dụng token tiêu chuẩn.`
                });
                continue;
              }
              const parts = cleanCls.split('-');
              if (parts.length < 2) continue;

              const prefix = parts.slice(0, -1).join('-');
              const suffix = parts[parts.length - 1];


              // 3. Typography & Text Color check
              if (cleanCls.startsWith('text-')) {
                let typoSuffix = cleanCls.replace('text-', '');
                typoSuffix = typoSuffix.split('/')[0]; // Strip opacity modifier
                const allowedTypo = ['display-2xl', 'display-xl', 'display-lg', 'display-sm', 'display-xs', 'xl', 'lg', 'md', 'sm', 'xs'];
                const allowedTextColors = ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring', 'white', 'black'];
                const textUtils = ['center', 'left', 'right', 'justify', 'start', 'end', 'wrap', 'nowrap', 'balance', 'pretty', 'clip', 'ellipsis', 'transparent', 'current'];
                
                if (!allowedTypo.includes(typoSuffix) && !allowedTextColors.includes(typoSuffix) && !textUtils.includes(typoSuffix)) {
                  context.report({
                    node: strNode,
                    message: `[Typography/Color] Lớp 'text-${typoSuffix}' không hợp lệ. Chỉ dùng Typography hoặc Text Color tokens của Shadcn.`
                  });
                }
              }

              // 4. Background Colors check
              if (cleanCls.startsWith('bg-')) {
                let bgSuffix = cleanCls.replace('bg-', '');
                bgSuffix = bgSuffix.split('/')[0]; // Strip opacity modifier
                const bgUtils = ['auto', 'cover', 'contain', 'center', 'bottom', 'top', 'left', 'right', 'repeat', 'no-repeat', 'transparent', 'current', 'none'];
                const allowedBg = ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring', 'white', 'black'];
                if (!allowedBg.includes(bgSuffix) && !bgUtils.includes(bgSuffix) && !bgSuffix.startsWith('gradient')) {
                  context.report({
                    node: strNode,
                    message: `[Bg Color] Màu nền '${bgSuffix}' không hợp lệ. Chỉ dùng Background Color tokens của Shadcn.`
                  });
                }
              }

              // 5. Border Colors check
              if (cleanCls.startsWith('border-') && !cleanCls.match(/^border-(t|r|b|l|x|y|solid|dashed|dotted|double|hidden|none)$/) && !cleanCls.match(/^border-(0|2|4|8)$/)) {
                let borderSuffix = cleanCls.replace(/^border-(?:t-|r-|b-|l-|x-|y-)?/, '');
                borderSuffix = borderSuffix.split('/')[0]; // Strip opacity modifier
                const allowedBorder = ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring', 'transparent', 'current', 'white', 'black'];
                if (!allowedBorder.includes(borderSuffix) && isNaN(borderSuffix)) {
                  context.report({
                    node: strNode,
                    message: `[Border Color] Màu viền '${borderSuffix}' không hợp lệ. Chỉ dùng Border Color tokens của Shadcn.`
                  });
                }
              }

              // 6. Foreground Colors check
              if (cleanCls.startsWith('fg-')) {
                let fgSuffix = cleanCls.replace('fg-', '');
                fgSuffix = fgSuffix.split('/')[0]; // Strip opacity modifier
                const allowedFg = ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring', 'white', 'black'];
                if (!allowedFg.includes(fgSuffix)) {
                  context.report({
                    node: strNode,
                    message: `[Foreground Color] Màu '${fgSuffix}' không hợp lệ. Chỉ dùng Foreground Color tokens của Shadcn.`
                  });
                }
              }
            }
          };

          if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
            checkString(node.value.value, node.value);
          } else if (node.value && node.value.type === 'JSXExpressionContainer') {
            const sourceCode = context.getSourceCode().getText(node.value);
            const stringRegex = /"([^"]+)"|'([^']+)'|`([^`]+)`/g;
            let match;
            while ((match = stringRegex.exec(sourceCode)) !== null) {
              const str = match[1] || match[2] || match[3];
              if (str) checkString(str, node.value);
            }
          }
        }
      };
    }
  },

  'require-popover-active-state': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Popover/DropdownMenu triggers must handle their open state using data-[state=open]: modifiers to remain visually selected when the popover is open.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      return {
        JSXElement(node) {
          const name = node.openingElement.name.name;
          if (name === 'DropdownMenuTrigger' || name === 'PopoverTrigger') {
            // Find the child element
            const childElement = node.children.find(child => child.type === 'JSXElement');
            if (!childElement) return;

            // Check if the child has a className attribute
            const classNameAttr = childElement.openingElement.attributes.find(
              attr => attr.type === 'JSXAttribute' && attr.name.name === 'className'
            );

            if (!classNameAttr || !classNameAttr.value) {
              context.report({
                node: childElement,
                message: `[Active State] Phần tử trigger của ${name} phải có class 'data-[state=open]:' để hiển thị trạng thái đang mở.`,
              });
              return;
            }

            const classNameStr = context.getSourceCode().getText(classNameAttr.value);
            if (!classNameStr.includes('data-[state=open]:')) {
              context.report({
                node: classNameAttr,
                message: `[Active State] Class của trigger ${name} thiếu modifier 'data-[state=open]:' (vd: data-[state=open]:opacity-100 hoặc data-[state=open]:bg-secondary).`,
              });
            }
          }
        }
      };
    }
  },

  'forbid-tailwind-invalid-spacing': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Forbid invalid tailwind spacing classes like gap-md, p-lg, etc.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      const regex = /\b(gap|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-(xxs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl)\b/g;
      return {
        Literal(node) {
          if (typeof node.value === 'string' && regex.test(node.value)) {
            const matches = node.value.match(regex);
            if (matches) {
              context.report({
                node,
                message: `[Quy Tắc Mới] Vi phạm: Không được sử dụng class khoảng cách không hợp lệ của Tailwind: ${matches.join(', ')}. Hãy dùng giá trị số (vd: gap-4 thay vì gap-md).`
              });
            }
          }
        },
        TemplateElement(node) {
          if (typeof node.value.raw === 'string' && regex.test(node.value.raw)) {
            const matches = node.value.raw.match(regex);
            if (matches) {
              context.report({
                node,
                message: `[Quy Tắc Mới] Vi phạm: Không được sử dụng class khoảng cách không hợp lệ của Tailwind: ${matches.join(', ')}. Hãy dùng giá trị số (vd: gap-4 thay vì gap-md).`
              });
            }
          }
        }
      };
    }
  },

  'enforce-typography-weights': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Chỉ cho phép sử dụng 4 font weight: 400 (font-normal), 500 (font-medium), 600 (font-semibold), và 700 (font-bold).',
      },
      schema: [],
    },
    create(context) {
      const regex = /\bfont-(thin|extralight|light|extrabold|black|hairline)\b/g;
      return {
        Literal(node) {
          if (typeof node.value === 'string' && regex.test(node.value)) {
            const matches = node.value.match(regex);
            if (matches) {
              context.report({
                node,
                message: `[Quy Tắc Typography] Vi phạm: Không được sử dụng font weight không hợp lệ: ${matches.join(', ')}. Chỉ cho phép: font-normal (400), font-medium (500), font-semibold (600), font-bold (700).`
              });
            }
          }
        },
        TemplateElement(node) {
          if (typeof node.value.raw === 'string' && regex.test(node.value.raw)) {
            const matches = node.value.raw.match(regex);
            if (matches) {
              context.report({
                node,
                message: `[Quy Tắc Typography] Vi phạm: Không được sử dụng font weight không hợp lệ: ${matches.join(', ')}. Chỉ cho phép: font-normal (400), font-medium (500), font-semibold (600), font-bold (700).`
              });
            }
          }
        }
      };
    }
  },

  'forbid-text-color-on-icon': {
    meta: {
      type: 'problem',
      fixable: 'code',
      docs: {
        description: 'Ngăn chặn việc gán màu trực tiếp cho icon trên các component Icon của Tabler. Hãy để icon kế thừa màu từ cha.',
      },
      schema: [],
    },
    create(context) {
      return {
        JSXElement(node) {
          const name = node.openingElement.name.name;
          // Tabler icons start with Icon
          if (name && typeof name === 'string' && name.startsWith('Icon')) {
            const classNameAttr = node.openingElement.attributes.find(
              attr => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'className'
            );
            if (!classNameAttr || !classNameAttr.value) return;

            const classNameStr = context.getSourceCode().getText(classNameAttr.value);
            // Check for common text colors that break inheritance
            const textRegex = /\btext-(muted-foreground|foreground|primary|secondary|accent|destructive|white|black|slate-\d+|gray-\d+|zinc-\d+|neutral-\d+|stone-\d+)(?:\/\d+)?\b/g;
            
            if (textRegex.test(classNameStr)) {
              context.report({
                node: classNameAttr,
                message: `[Icon Color] Vi phạm: Icon '${name}' không nên gán màu cứng (vd: text-muted-foreground). Hãy xóa class màu đi để icon tự động kế thừa màu (inherit) từ element cha, giúp đồng bộ màu với text (kể cả khi hover).`,
                fix(fixer) {
                  const newClassName = classNameStr.replace(textRegex, '').replace(/\s+(?=["'`}])/g, '').replace(/(?<=["'`{])\s+/g, '').replace(/\s{2,}/g, ' ');
                  return fixer.replaceText(classNameAttr.value, newClassName);
                }
              });
            }
          }
        }
      };
    }
  },

  /**
   * Quy tắc: Cấm truyền giá trị màu hardcoded (hex/rgb/rgba/oklch) trực tiếp vào
   * BlockNoteView theme prop hoặc vào className khi đang trong context BlockNote.
   * Phải luôn dùng shadcn CSS tokens (var(--background), var(--border), v.v.)
   */
  'forbid-blocknote-raw-css': {
    meta: {
      type: 'problem',
      docs: {
        description: '[BlockNote] Cấm dùng màu hardcoded (hex/rgb) trong theme prop hoặc style của BlockNoteView. Dùng shadcn CSS variables thay thế.',
      },
      schema: [],
    },
    create(context) {
      // Regex nhận dạng màu hardcoded
      const HEX_REGEX = /#([0-9a-fA-F]{3,8})\b/;
      const RGB_REGEX = /\brgb(a)?\s*\(/;
      const OKLCH_REGEX = /\boklch\s*\(/;
      const HARDCODED_COLOR = new RegExp(
        `(${HEX_REGEX.source}|${RGB_REGEX.source}|${OKLCH_REGEX.source})`
      );

      // Chỉ check các file liên quan BlockNote
      const filename = context.getFilename().replace(/\\/g, '/');
      const isBlockNoteFile = (
        filename.includes('NotoEditor') ||
        filename.includes('blocknote') ||
        filename.includes('BlockNote') ||
        filename.includes('packages/editor')
      );
      if (!isBlockNoteFile) return {};

      return {
        // Phát hiện: <BlockNoteView theme="light" /> mà KHÔNG có CSS override trong _blocknote.css
        // BlockNote shadcn chỉ nhận "light"/"dark" (không phải theme object).
        // CSS thực tế phải override qua `.bn-shadcn .bn-container.light` trong _blocknote.css.
        // Rule này NHẮC NHỞ: nếu đang dùng theme string, hãy đảm bảo _blocknote.css đã import.
        JSXAttribute(node) {
          const openingEl = node.parent;
          const componentName =
            openingEl?.name?.name ?? // <Component ... />
            openingEl?.name?.object?.name; // <Ns.Component ... />

          if (node.name.name !== 'theme') return;
          if (componentName !== 'BlockNoteView') return;

          const BN_THEME_STRINGS = new Set(['light', 'dark']);

          // Pattern 1: theme="dark" (Literal trực tiếp) — OK về API nhưng kiểm tra hardcoded màu
          if (
            node.value?.type === 'Literal' &&
            BN_THEME_STRINGS.has(node.value.value)
          ) {
            // Đây là cách đúng cho BlockNote shadcn — không báo lỗi
            return;
          }

          // Pattern 2: theme={...}
          if (node.value?.type === 'JSXExpressionContainer') {
            const expr = node.value.expression;
            // theme={'dark'} — OK về API
            if (expr.type === 'Literal' && BN_THEME_STRINGS.has(expr.value)) {
              return;
            }
            // theme={cond ? 'dark' : 'light'} — cách đúng (NotoEditor dùng pattern này)
            if (
              expr.type === 'ConditionalExpression' &&
              expr.consequent?.type === 'Literal' &&
              expr.alternate?.type === 'Literal' &&
              BN_THEME_STRINGS.has(expr.consequent.value) &&
              BN_THEME_STRINGS.has(expr.alternate.value)
            ) {
              return; // Correct pattern — no error
            }

            // Mọi giá trị khác (ví dụ theme object từ mantine) — cảnh báo
            context.report({
              node,
              message:
                '[BlockNote Shadcn] `theme` prop chỉ nhận "light" hoặc "dark". ' +
                'Để tùy biến màu, hãy dùng CSS override trong styles/_blocknote.css ' +
                'scoped vào `.bn-shadcn .bn-container.light` / `.bn-shadcn .bn-container.dark`.',
            });
          }
        },

        // Bắt: hardcoded hex/rgb trong JSX attribute value (className, style object...)
        Literal(node) {
          if (typeof node.value !== 'string') return;
          if (!HARDCODED_COLOR.test(node.value)) return;

          // Chỉ báo lỗi nếu literal nằm trong JSX attribute (className, style, etc)
          const parent = node.parent;
          if (
            parent.type === 'JSXAttribute' ||
            parent.type === 'JSXExpressionContainer' ||
            parent.type === 'Property' // style={{ color: '#fff' }}
          ) {
            context.report({
              node,
              message:
                `[BlockNote] Vi phạm: Màu hardcoded "${node.value}" không được dùng trong file liên quan BlockNote. ` +
                'Hãy dùng shadcn CSS variable: var(--background), var(--foreground), var(--border), v.v.',
            });
          }
        },
      };
    }
  },
  
  // ─── Rule mới: Cấm onClick trên Layout Components ──────────────────────────
  'forbid-onclick-on-layout-components': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm dùng thuộc tính onClick trên các layout components như Box, Flex, Text. Phải dùng ActionArea, Button, hoặc Component tương tác chuyên biệt.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui')) {
        return {};
      }
      
      const LAYOUT_COMPONENTS = new Set([
        'Box', 'Flex', 'Text', 'ScrollArea', 'Section', 'Container', 'Stack', 'Grid'
      ]);

      return {
        JSXOpeningElement(node) {
          const elementName = node.name.name || (node.name.property && node.name.property.name);
          if (!elementName || !LAYOUT_COMPONENTS.has(elementName)) return;

          for (const attr of node.attributes) {
            if (attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'onClick') {
              context.report({
                node: attr,
                message: `[Quy Tắc Layout] Tuyên án tử: Cấm dùng onClick trên layout component <${elementName}>. Hãy wrap bên trong <ActionArea> hoặc dùng <Button variant="ghost">.`
              });
            }
          }
        }
      };
    }
  },

  // ─── Rule mới: Cấm CSS tĩnh phá hỏng Empty Component ──────────────────────
  'forbid-custom-classname-on-empty-state': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm dùng thuộc tính className trên các sub-components của Empty (EmptyMedia, EmptyTitle, EmptyDescription, EmptyHeader, EmptyContent) để tránh phá hỏng thiết kế chuẩn của hệ thống.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui/empty')) {
        return {};
      }
      
      const EMPTY_SUBCOMPONENTS = new Set([
        'EmptyMedia', 'EmptyTitle', 'EmptyDescription', 'EmptyHeader', 'EmptyContent'
      ]);

      return {
        JSXOpeningElement(node) {
          const elementName = node.name.name || (node.name.property && node.name.property.name);
          if (!elementName || !EMPTY_SUBCOMPONENTS.has(elementName)) return;

          for (const attr of node.attributes) {
            if (attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'className') {
              context.report({
                node: attr,
                message: `[Quy Tắc UI] Tuyệt đối không được truyền className vào <${elementName}>. Hãy để component này giữ nguyên styling chuẩn của Design System.`
              });
            }
          }
        }
      };
    }
  },

  // ─── Rule mới: Cấm sử dụng arbitrary h-[...], w-[...] classes ──────────────────────
  'forbid-custom-hw-classes': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Nghiêm cấm hành vi dùng class h w tự chế inline (arbitrary tailwind classes như h-[100px], w-[50%]) để sửa thành phần UI.',
      },
      schema: [],
    },
    create(context) {
      const _filename = context.getFilename ? context.getFilename() : context.getPhysicalFilename();
      if (_filename.replace(/\\/g, '/').includes('src/components/ui/')) {
        return {};
      }

      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return;

          const checkString = (str, strNode) => {
            const classes = str.split(/\s+/);
            for (const cls of classes) {
              if (!cls) continue;

              // Check for h-[...], w-[...], min-h-[...], max-h-[...], min-w-[...], max-w-[...]
              const regex = /^(?:min-|max-)?(?:h|w)-\[.+\]$/;
              
              if (regex.test(cls)) {
                context.report({
                  node: strNode,
                  message: `[Quy Tắc UI Sạch] Nghiêm cấm dùng class tự chế inline '${cls}'. Hãy sử dụng các class Tailwind kích thước chuẩn hoặc Component có sẵn.`
                });
              }
            }
          };

          if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
            checkString(node.value.value, node.value);
          } else if (node.value && node.value.type === 'JSXExpressionContainer') {
            const sourceCode = context.getSourceCode().getText(node.value);
            const stringRegex = /"([^"]+)"|'([^']+)'|`([^`]+)`/g;
            let match;
            while ((match = stringRegex.exec(sourceCode)) !== null) {
              const str = match[1] || match[2] || match[3];
              if (str) checkString(str, node.value);
            }
          }
        }
      };
    }
  },
};