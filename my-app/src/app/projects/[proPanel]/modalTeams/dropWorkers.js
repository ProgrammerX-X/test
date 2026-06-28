import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import {DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { SortableItem } from '../../../list/SortableItem';
import { components } from 'react-select';
import './page.css'
const Select = dynamic(
  () => import('react-select'),
  { ssr: false }
);
export function DropWorkers({callback, methods, value, type, containerStyle}) {
const CheckboxOption = (props) => {
  const { data, isSelected, innerRef, innerProps } = props;
  
  return (
    <div ref={innerRef} {...innerProps} style={{ display: 'flex', alignItems: 'center', padding: '0.4em 0.4em' }}>
      <div style={{ position: 'relative' }}>
        <input
          type={type === 'checkbox' ? 'checkbox' : 'radio'}
          checked={isSelected}
          readOnly
          style={{ position: 'absolute', opacity: 0, width: '3em', height: '3em' }}
        />
        <div style={{
          width: '1.2em',
          height: '1.2em',
          borderRadius: '50%',
          backgroundColor: isSelected ? '#4CAF50' : '#ffffff',
          transition: 'all 0.2s',
          marginRight: '0.5em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isSelected && <span>✓</span>}
        </div>
      </div>
      <span>{data.label}</span>
    </div>
  );
};

const CustomValueContainer = (props) => {
  return (
    <components.ValueContainer {...props}>
      <span style={{color: 'white'}}>
      {props.selectProps.placeholder}
      </span>
    </components.ValueContainer>
  );
};

const CustomMultiValue = () => null;

  const [selectedValues, setSelectedValues] = useState();
  useEffect(()=>{
    if(type === 'checkbox'){
      setSelectedValues([])
    }else{
      setSelectedValues(null)
    }
  }, [type])

  const [tempSelected, setTempSelected] = useState(type === 'checkbox' ? [] : null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  const handleMenuOpen = () => {
    if (type === 'checkbox'){
    setTempSelected([...selectedValues]);
    }else{
      setTempSelected(selectedValues)
    }
    setMenuIsOpen(true);
  };

  const handleMenuClose = () => {
    setMenuIsOpen(false);
  };

  const [employees_, setEmployees] = useState([''])

  const handleChange = (selected) => {
    setTempSelected(selected);
    setSelectedValues(selected);
    setEmployees(selected)

    if (type === 'radio' && callback) {
      callback(selected);
    }
  };

const CustomMenuList = (props) => {
  return (
    <components.MenuList {...props}>
      {props.children}
      <div className='droplist_button'>
        <button className='button_style' onClick={()=>callback(employees_)}>Assign</button>
      </div>
    </components.MenuList>
  );
};

  let colors = ['#1b5bb8', '#2f67c0', '#1b5bb8', '#2f67c0', '#2261bf', '#1e4d93']
  return (
    <Select
      options={methods}
      value={tempSelected}
      onChange={handleChange}
      isMulti={type === 'checkbox'}
      menuIsOpen={menuIsOpen}
      onMenuOpen={handleMenuOpen}
      onMenuClose={handleMenuClose}
      components={{ Option: CheckboxOption,
        ValueContainer: CustomValueContainer,
        MultiValue: CustomMultiValue,
        MenuList: CustomMenuList}}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      placeholder={`Select ${value}`}
      styles={{
        control: (base) => ({
          ...base,
          background: `linear-gradient(to top, ${colors[0]}, ${colors[1]})`,
          border: 'none'
        }),
        singleValue: (base) => ({
          ...base,
          color: '#ffffff',
          fontFamily: 'REM'
        }),
        menuList: (base) => ({
          ...base,
          marginTop: 0,
          padding: 0,
          color: 'white',
          fontFamily: 'REM',
          background: `linear-gradient(to top, ${colors[2]}, ${colors[3]})`,
          overflow: 'hidden',
          maxHeight:'none'
        }),
        menu: (base) => ({ 
          ...base, 
          top: '2em',
          padding: 0
        }),
        group: (base) => ({
          ...base,
          paddingTop: 0,
          paddingBottom: 0,
        }),
        groupHeading: (base) => ({
          ...base,
          color: '#ffffff',
          fontFamily: 'REM',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '8px 12px',
          margin: 0,
          backgroundColor: 'rgba(0,0,0,0.2)',
          textTransform: 'none',
        }),
        option: (base, state) => ({
          ...base,
          padding: '8px 12px',
          paddingLeft: '24px',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: colors[4],
            color: 'white'
          },
          ...(state.isFocused && {
            backgroundColor: 'transparent',
            color: '#ffffff',
          }),
          ...(state.isSelected && {
            backgroundColor: colors[5],
            color: 'white',
            '&:hover': {
              backgroundColor: colors[5]
            }
          })
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: '#ffffff',
          '&:hover': {
            color: '#ffffff'
          }
        }),
        container: (base)=>({
          ...base,
          marginTop: '0.5em',
          height: '20em',
          zIndex: menuIsOpen ? 2 : 1,
          borderRadius: '1em',
          overflow: 'auto',
          maxHeight:'25em',
          ...containerStyle
        })
      }
    }
    />
  );
}


export function GetRoles({callback, value, methods, width, containerStyle, type}) {
const CheckboxOption = (props) => {
  const { data, isSelected, innerRef, innerProps } = props;
  
  return (
    <div ref={innerRef} {...innerProps} style={{ display: 'flex', alignItems: 'center', padding: '0.4em 0.4em' }}>
      <div style={{ position: 'relative' }}>
        <input
          type={'checkbox'}
          checked={isSelected}
          readOnly
          style={{ position: 'absolute', opacity: 0, width: '3em', height: '3em' }}
        />
        <div style={{
          width: '1.2em',
          height: '1.2em',
          borderRadius: '1em',
          backgroundColor: isSelected ? '#e8e8eb' : '#ffffff',
          border:'1px solid #d3d3d3',
          transition: 'all 1s',
          marginRight: '0.5em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isSelected && <span>✓</span>}
        </div>
      </div>
      <span style={{fontSize: '0.9em'}}>{data.label}</span>
    </div>
  );
};

const CustomValueContainer = (props) => {
  return (
    <components.ValueContainer {...props}>
      <span style={{color: '#070b15', fontSize: '0.9em'}}>
      {props.selectProps.placeholder}
      </span>
    </components.ValueContainer>
  );
};

const CustomMultiValue = () => null;

  const [tempSelected, setTempSelected] = useState([])
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  const handleMenuOpen = () => {
    setMenuIsOpen(true);
  };

  const handleMenuClose = () => {
    setMenuIsOpen(false);
  };

  const handleChange = (selected) => {
    setTempSelected(selected)
  };

const CustomMenuList = (props) => {
  return (
    <components.MenuList {...props}>
      {props.children}
      <div className='droplist_button'>
        <button className='button_style' onClick={()=>{callback(tempSelected)}}>Assign</button>
      </div>
    </components.MenuList>
  );
};
// useEffect(()=>{
  // console.log(containerStyle_menu)
// }, [])
// console.log('containerStyle menu: ', containerStyle_menu, 278)

  let colors = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff']
  return (
    <Select
      options={methods}
      onChange={handleChange}
      isMulti={type === 'checkbox'}
      menuIsOpen={menuIsOpen}
      onMenuOpen={handleMenuOpen}
      onMenuClose={handleMenuClose}
      components={{ Option: CheckboxOption,
        ValueContainer: CustomValueContainer,
        MultiValue: CustomMultiValue,
        MenuList: CustomMenuList}}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      // menuPortalTarget={menuPortalTarget}
      placeholder={`${value}`}
      styles={{
        control: (base) => ({
          ...base,
          background: `linear-gradient(to top, ${colors[0]}, ${colors[1]})`,
          border: 'none'
        }),
        singleValue: (base) => ({
          ...base,
          color: '#070b15',
          fontFamily: 'REM'
        }),
        menuList: (base) => ({
          ...base,
          marginTop: 0,
          padding: 0,
          color: '#070b15',
          fontFamily: 'REM',
          background: `linear-gradient(to top, ${colors[2]}, ${colors[3]})`,
          overflowY:'auto', 
          height: '110px',
          // ...containerStyle_menu
        }),
        menu: (base) => ({ 
          ...base, 
          top: '2em',
          padding: 0,
        }),
        group: (base) => ({
          ...base,
          paddingTop: 0,
          paddingBottom: 0,
        }),
        groupHeading: (base) => ({
          ...base,
          color: '#070b15',
          fontFamily: 'REM',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '8px 12px',
          margin: 0,
          backgroundColor: 'rgba(0,0,0,0.2)',
          textTransform: 'none',
        }),
        option: (base, state) => ({
          ...base,
          padding: '8px 12px',
          paddingLeft: '24px',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: colors[4],
            color: '#070b15'
          },
          ...(state.isFocused && {
            backgroundColor: 'transparent',
            color: '#070b15',
          }),
          ...(state.isSelected && {
            backgroundColor: colors[5],
            color: '#070b15',
            '&:hover': {
              backgroundColor: colors[5]
            }
          })
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: '#070b15',
          '&:hover': {
            color: '#070b15'
          }
        }),
        container: (base)=>({
          ...base,
          width: width,
          height: 'auto',
          position: 'relative',
          zIndex: menuIsOpen ? 2 : 1,
          maxHeight:'25em',
          border: '1px solid #e8e8eb',
          borderRadius: '0.3em',
          ...containerStyle
        }),
      }
    }
    />
  );
}