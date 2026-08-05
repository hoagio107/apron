import { Button, Card, CardBody, Input, Textarea, Divider, Select, SelectItem, Checkbox, Switch, Chip, Tabs, Tab } from '@apron/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Search, Plus, Trash2 } from 'lucide-react';

export function DesignSystemPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Design System"
      />
      
      <div className="flex-1 overflow-y-auto mt-4 pb-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          
          {/* Colors */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Màu sắc (Colors)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <ColorBox bg="bg-primary" text="text-primary-foreground" name="Primary" />
              <ColorBox bg="bg-secondary" text="text-secondary-foreground" name="Secondary" />
              <ColorBox bg="bg-success" text="text-success-foreground" name="Success" />
              <ColorBox bg="bg-warning" text="text-warning-foreground" name="Warning" />
              <ColorBox bg="bg-danger" text="text-danger-foreground" name="Danger" />
              <ColorBox bg="bg-default" text="text-default-foreground" name="Default" />
            </div>
          </section>

          <Divider />

          {/* Typography */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Kiểu chữ (Typography)</h2>
            <Card shadow="sm">
              <CardBody className="gap-4">
                <div><h1 className="text-5xl font-bold">Heading 1 (5xl)</h1></div>
                <div><h2 className="text-4xl font-bold">Heading 2 (4xl)</h2></div>
                <div><h3 className="text-3xl font-bold">Heading 3 (3xl)</h3></div>
                <div><h4 className="text-2xl font-bold">Heading 4 (2xl)</h4></div>
                <div><h5 className="text-xl font-bold">Heading 5 (xl)</h5></div>
                <div><h6 className="text-lg font-bold">Heading 6 (lg)</h6></div>
                <Divider />
                <div><p className="text-base">Paragraph (base) - The quick brown fox jumps over the lazy dog. Đây là một đoạn văn bản mẫu để kiểm tra hiển thị chữ. 1234567890.</p></div>
                <div><p className="text-sm text-default-500">Small text (sm) - Ghi chú hoặc thông tin phụ.</p></div>
                <div><p className="text-xs text-default-400">Tiny text (xs) - Thông tin siêu nhỏ.</p></div>
              </CardBody>
            </Card>
          </section>

          <Divider />

          {/* Buttons */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Nút bấm (Buttons)</h2>
            <div className="flex flex-col gap-6">
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-default-600">Variants (Color: Primary)</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <Button color="primary" variant="solid">Solid</Button>
                  <Button color="primary" variant="faded">Faded</Button>
                  <Button color="primary" variant="bordered">Bordered</Button>
                  <Button color="primary" variant="light">Light</Button>
                  <Button color="primary" variant="flat">Flat</Button>
                  <Button color="primary" variant="ghost">Ghost</Button>
                  <Button color="primary" variant="shadow">Shadow</Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-default-600">Colors (Variant: Solid)</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <Button color="default">Default</Button>
                  <Button color="primary">Primary</Button>
                  <Button color="secondary">Secondary</Button>
                  <Button color="success">Success</Button>
                  <Button color="warning">Warning</Button>
                  <Button color="danger">Danger</Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-default-600">Sizes & States</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <Button size="sm" color="primary">Small</Button>
                  <Button size="md" color="primary">Medium (Default)</Button>
                  <Button size="lg" color="primary">Large</Button>
                  <Button color="primary" isDisabled>Disabled</Button>
                  <Button color="primary" isLoading>Loading</Button>
                  <Button isIconOnly color="danger" variant="flat" aria-label="Delete"><Trash2 className="w-5 h-5" /></Button>
                  <Button color="primary" startContent={<Plus className="w-4 h-4" />}>With Icon</Button>
                </div>
              </div>

            </div>
          </section>

          <Divider />

          {/* Inputs & Forms */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Nhập liệu (Inputs & Forms)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-default-600">Variants</h3>
                <Input label="Flat (Default)" labelPlacement="outside" variant="flat" placeholder="Nhập văn bản..." />
                <Input label="Bordered" labelPlacement="outside" variant="bordered" placeholder="Nhập văn bản..." />
                <Input label="Faded" labelPlacement="outside" variant="faded" placeholder="Nhập văn bản..." />
                <Input label="Underlined" labelPlacement="outside" variant="underlined" placeholder="Nhập văn bản..." />
              </div>
              <div className="flex flex-col gap-8">
                <h3 className="text-lg font-semibold text-default-600">States & Features</h3>
                <Input label="Disabled" labelPlacement="outside" isDisabled placeholder="Không thể nhập" defaultValue="Dữ liệu mẫu" />
                <Input label="Read Only" labelPlacement="outside" isReadOnly placeholder="Chỉ đọc" defaultValue="Dữ liệu mẫu" />
                <Input label="With Error" labelPlacement="outside" isInvalid errorMessage="Vui lòng nhập đúng định dạng email" placeholder="email@example.com" />
                <Input label="With Icon" labelPlacement="outside" placeholder="Tìm kiếm..." startContent={<Search className="w-4 h-4 text-default-400" />} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="flex flex-col gap-8">
                <h3 className="text-lg font-semibold text-default-600">Textarea</h3>
                <Textarea label="Mô tả" labelPlacement="outside" placeholder="Nhập nội dung dài vào đây..." variant="flat" />
              </div>
              <div className="flex flex-col gap-8">
                <h3 className="text-lg font-semibold text-default-600">Select</h3>
                <Select label="Chọn danh mục" labelPlacement="outside" placeholder="-- Chọn --" variant="flat">
                  <SelectItem key="1">Món chính</SelectItem>
                  <SelectItem key="2">Món tráng miệng</SelectItem>
                  <SelectItem key="3">Đồ uống</SelectItem>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-8 mt-8 items-center">
              <Checkbox defaultSelected color="primary">Checkbox 1</Checkbox>
              <Checkbox color="danger">Checkbox 2</Checkbox>
              <Switch defaultSelected color="success" size="sm">Công tắc (Switch)</Switch>
            </div>
          </section>

          <Divider />

          {/* Cards & Chips */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Các thành phần khác (Misc)</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-default-600">Chips</h3>
              <div className="flex flex-wrap gap-2">
                <Chip>Default</Chip>
                <Chip color="primary" variant="flat">Primary Flat</Chip>
                <Chip color="success" variant="dot">Success Dot</Chip>
                <Chip color="warning" variant="faded">Warning Faded</Chip>
                <Chip color="danger" variant="bordered">Danger Bordered</Chip>
                <Chip color="secondary" size="sm">Small</Chip>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-default-600">Tabs</h3>
              <Tabs aria-label="Options" color="primary" variant="underlined">
                <Tab key="photos" title="Photos" />
                <Tab key="music" title="Music" />
                <Tab key="videos" title="Videos" />
              </Tabs>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-default-600">Card Layouts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card shadow="sm">
                  <CardBody>
                    <p>Một chiếc Card cơ bản với bóng mờ (shadow="sm").</p>
                  </CardBody>
                </Card>
                <Card shadow="md" className="bg-primary text-primary-foreground">
                  <CardBody>
                    <p>Card mang màu sắc nhận diện với shadow="md".</p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function ColorBox({ bg, text, name }: { bg: string; text: string; name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`w-full aspect-video rounded-xl shadow-sm ${bg} flex items-center justify-center`}>
        <span className={`font-medium ${text}`}>Aa</span>
      </div>
      <p className="text-center font-medium text-sm">{name}</p>
    </div>
  );
}
